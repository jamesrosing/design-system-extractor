#!/usr/bin/env node
/**
 * Compare Project Styles Against Reference Design System
 *
 * Features:
 * - CIE ΔE 2000 perceptually accurate color comparison
 * - WCAG 2.1 contrast ratio accessibility audit
 * - Typography, spacing, and border-radius matching
 *
 * Usage:
 *   node compare-design-systems.js <project-path> <reference.json> [output.md]
 *   node compare-design-systems.js /path/to/project examples/extracted/duchateau.json
 *
 * Auto-detects: Tailwind config, CSS variables, CSS files
 * Outputs: Markdown comparison report with similarity scores and accessibility audit
 */

const fs = require('fs');
const path = require('path');

// ============ COLOR UTILITIES ============

function hexToRgb(hex) {
  if (!hex) return null;
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToLab(rgb) {
  if (!rgb) return null;

  // Convert RGB to XYZ (sRGB with D65 illuminant)
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100; g *= 100; b *= 100;

  // D65 reference white
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  let x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / refX;
  let y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / refY;
  let z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / refZ;

  const epsilon = 0.008856;
  const kappa = 903.3;

  x = x > epsilon ? Math.pow(x, 1/3) : (kappa * x + 16) / 116;
  y = y > epsilon ? Math.pow(y, 1/3) : (kappa * y + 16) / 116;
  z = z > epsilon ? Math.pow(z, 1/3) : (kappa * z + 16) / 116;

  return {
    L: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  };
}

/**
 * CIE ΔE 2000 - Perceptually uniform color difference
 * Reference: http://www.ece.rochester.edu/~gsharma/ciede2000/
 */
function deltaE2000(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return Infinity;

  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);
  if (!lab1 || !lab2) return Infinity;

  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  // Weighting factors
  const kL = 1, kC = 1, kH = 1;

  // Calculate C' and h'
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cab = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cab, 7) / (Math.pow(Cab, 7) + Math.pow(25, 7))));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p = Math.atan2(b1, a1p) * 180 / Math.PI;
  const h2p = Math.atan2(b2, a2p) * 180 / Math.PI;
  const h1pAdj = h1p < 0 ? h1p + 360 : h1p;
  const h2pAdj = h2p < 0 ? h2p + 360 : h2p;

  // Calculate ΔL', ΔC', ΔH'
  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2pAdj - h1pAdj) <= 180) {
    dhp = h2pAdj - h1pAdj;
  } else if (h2pAdj - h1pAdj > 180) {
    dhp = h2pAdj - h1pAdj - 360;
  } else {
    dhp = h2pAdj - h1pAdj + 360;
  }

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);

  // Calculate mean values
  const Lp = (L1 + L2) / 2;
  const Cp = (C1p + C2p) / 2;

  let Hp;
  if (C1p * C2p === 0) {
    Hp = h1pAdj + h2pAdj;
  } else if (Math.abs(h1pAdj - h2pAdj) <= 180) {
    Hp = (h1pAdj + h2pAdj) / 2;
  } else if (h1pAdj + h2pAdj < 360) {
    Hp = (h1pAdj + h2pAdj + 360) / 2;
  } else {
    Hp = (h1pAdj + h2pAdj - 360) / 2;
  }

  // Calculate T
  const T = 1 - 0.17 * Math.cos((Hp - 30) * Math.PI / 180)
              + 0.24 * Math.cos(2 * Hp * Math.PI / 180)
              + 0.32 * Math.cos((3 * Hp + 6) * Math.PI / 180)
              - 0.20 * Math.cos((4 * Hp - 63) * Math.PI / 180);

  // Calculate SL, SC, SH
  const dTheta = 30 * Math.exp(-Math.pow((Hp - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(Cp, 7) / (Math.pow(Cp, 7) + Math.pow(25, 7)));
  const SL = 1 + (0.015 * Math.pow(Lp - 50, 2)) / Math.sqrt(20 + Math.pow(Lp - 50, 2));
  const SC = 1 + 0.045 * Cp;
  const SH = 1 + 0.015 * Cp * T;
  const RT = -Math.sin(2 * dTheta * Math.PI / 180) * RC;

  // Final calculation
  const dE = Math.sqrt(
    Math.pow(dLp / (kL * SL), 2) +
    Math.pow(dCp / (kC * SC), 2) +
    Math.pow(dHp / (kH * SH), 2) +
    RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  );

  return dE;
}

// Legacy CIE76 for backward compatibility
function deltaE76(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return Infinity;

  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);
  if (!lab1 || !lab2) return Infinity;

  return Math.sqrt(
    Math.pow(lab2.L - lab1.L, 2) +
    Math.pow(lab2.a - lab1.a, 2) +
    Math.pow(lab2.b - lab1.b, 2)
  );
}

// Default to ΔE 2000
const deltaE = deltaE2000;

function normalizeColor(color) {
  if (!color) return null;
  color = String(color).trim().toLowerCase();

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // Handle hex
  if (color.startsWith('#')) {
    if (color.length === 4) {
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    return color.slice(0, 7);
  }

  // Named colors (common ones)
  const named = {
    white: '#ffffff', black: '#000000', red: '#ff0000',
    green: '#008000', blue: '#0000ff', transparent: null,
    gray: '#808080', grey: '#808080', silver: '#c0c0c0',
    navy: '#000080', teal: '#008080', purple: '#800080',
    orange: '#ffa500', yellow: '#ffff00', lime: '#00ff00',
    aqua: '#00ffff', cyan: '#00ffff', magenta: '#ff00ff',
    fuchsia: '#ff00ff', maroon: '#800000', olive: '#808000'
  };
  return named[color] || null;
}

// ============ WCAG ACCESSIBILITY ============

function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function checkWCAG(foreground, background) {
  const ratio = getContrastRatio(foreground, background);
  return {
    ratio: ratio.toFixed(2),
    AA: {
      normalText: ratio >= 4.5,
      largeText: ratio >= 3,
      uiComponents: ratio >= 3
    },
    AAA: {
      normalText: ratio >= 7,
      largeText: ratio >= 4.5
    }
  };
}

function auditAccessibility(colors) {
  const issues = [];
  const passing = [];

  // Get background and text colors
  const backgrounds = colors.semantic?.backgrounds?.map(c => c.value) || [];
  const textColors = colors.semantic?.text?.map(c => c.value) || [];

  // Check common combinations
  for (const bg of backgrounds.slice(0, 3)) {
    for (const text of textColors.slice(0, 3)) {
      if (!bg || !text) continue;
      const result = checkWCAG(text, bg);
      const combo = { foreground: text, background: bg, ...result };

      if (!result.AA.normalText) {
        issues.push({
          type: 'contrast',
          severity: 'error',
          ...combo,
          message: `Fails WCAG AA for normal text (${result.ratio}:1, needs 4.5:1)`
        });
      } else if (!result.AAA.normalText) {
        issues.push({
          type: 'contrast',
          severity: 'warning',
          ...combo,
          message: `Passes AA but fails AAA (${result.ratio}:1, needs 7:1 for AAA)`
        });
      } else {
        passing.push(combo);
      }
    }
  }

  // Check accent colors on backgrounds
  const accents = colors.semantic?.accents?.map(c => c.value) || [];
  for (const bg of backgrounds.slice(0, 2)) {
    for (const accent of accents.slice(0, 2)) {
      if (!bg || !accent) continue;
      const result = checkWCAG(accent, bg);
      if (!result.AA.uiComponents) {
        issues.push({
          type: 'contrast',
          severity: 'warning',
          foreground: accent,
          background: bg,
          ...result,
          message: `Accent color may be hard to see (${result.ratio}:1, needs 3:1 for UI)`
        });
      }
    }
  }

  return { issues, passing };
}

// ============ PROJECT STYLE EXTRACTION ============

function detectProjectType(projectPath) {
  const files = fs.readdirSync(projectPath);

  if (files.some(f => f.match(/tailwind\.config\.(js|ts|mjs|cjs)$/))) {
    return 'tailwind';
  }

  const pkgPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['styled-components'] || deps['@emotion/react'] || deps['@emotion/styled']) {
        return 'css-in-js';
      }
    } catch (e) {}
  }

  return 'css';
}

function extractTailwindConfig(projectPath) {
  const configFiles = ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs', 'tailwind.config.cjs'];
  let configPath = null;

  for (const file of configFiles) {
    const fullPath = path.join(projectPath, file);
    if (fs.existsSync(fullPath)) {
      configPath = fullPath;
      break;
    }
  }

  if (!configPath) return null;

  const content = fs.readFileSync(configPath, 'utf-8');
  const extracted = { colors: {}, fonts: [], spacing: [], borderRadius: [], shadows: [] };

  // Extract colors (handles nested objects)
  const colorMatches = content.matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"]?(#[a-fA-F0-9]{3,8}|rgb[a]?\([^)]+\))['"]?/g);
  for (const match of colorMatches) {
    const normalized = normalizeColor(match[2]);
    if (normalized) extracted.colors[match[1]] = normalized;
  }

  // Extract font families
  const fontMatches = content.matchAll(/fontFamily\s*:\s*\{([^}]+)\}/gs);
  for (const match of fontMatches) {
    const fonts = match[1].matchAll(/['"]([^'"]+)['"]/g);
    for (const font of fonts) {
      if (!font[1].includes('system') && !font[1].includes('sans-serif')) {
        extracted.fonts.push(font[1]);
      }
    }
  }

  // Extract spacing values
  const spacingMatches = content.matchAll(/spacing\s*:\s*\{([^}]+)\}/gs);
  for (const match of spacingMatches) {
    const values = match[1].matchAll(/['"]?([\d.]+(?:px|rem|em)?)['"]/g);
    for (const val of values) {
      extracted.spacing.push(val[1]);
    }
  }

  // Extract border radius
  const radiusMatches = content.matchAll(/borderRadius\s*:\s*\{([^}]+)\}/gs);
  for (const match of radiusMatches) {
    const values = match[1].matchAll(/['"]?([\d.]+(?:px|rem|em)?)['"]/g);
    for (const val of values) {
      extracted.borderRadius.push(val[1]);
    }
  }

  return extracted;
}

function extractCSSVariables(projectPath) {
  const extracted = { colors: {}, fonts: [], spacing: [], borderRadius: [], shadows: [] };

  // Find CSS files
  const findCSS = (dir, files = []) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findCSS(fullPath, files);
        } else if (entry.name.match(/\.(css|scss|sass)$/)) {
          files.push(fullPath);
        }
      }
    } catch (e) {}
    return files;
  };

  const cssFiles = findCSS(projectPath);

  for (const file of cssFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');

      // Extract CSS variables from :root
      const rootMatch = content.match(/:root\s*\{([^}]+)\}/s);
      if (rootMatch) {
        const vars = rootMatch[1].matchAll(/--([^:]+):\s*([^;]+);/g);
        for (const v of vars) {
          const name = v[1].trim();
          const value = v[2].trim();

          if (name.includes('color') || name.includes('bg') || name.includes('text') || name.includes('border')) {
            const normalized = normalizeColor(value);
            if (normalized) extracted.colors[name] = normalized;
          } else if (name.includes('font') && !name.includes('size')) {
            extracted.fonts.push(value.replace(/['"]/g, '').split(',')[0].trim());
          } else if (name.includes('spacing') || name.includes('gap') || name.includes('margin') || name.includes('padding')) {
            extracted.spacing.push(value);
          } else if (name.includes('radius')) {
            extracted.borderRadius.push(value);
          } else if (name.includes('shadow')) {
            extracted.shadows.push(value);
          }
        }
      }

      // Extract inline colors
      const colorMatches = content.matchAll(/(#[a-fA-F0-9]{3,8}|rgb[a]?\([^)]+\))/g);
      for (const match of colorMatches) {
        const normalized = normalizeColor(match[1]);
        if (normalized && !Object.values(extracted.colors).includes(normalized)) {
          extracted.colors[`inline-${Object.keys(extracted.colors).length}`] = normalized;
        }
      }
    } catch (e) {}
  }

  return extracted;
}

function extractProjectStyles(projectPath) {
  const type = detectProjectType(projectPath);

  switch (type) {
    case 'tailwind':
      return { type, styles: extractTailwindConfig(projectPath) };
    case 'css':
    case 'css-in-js':
      return { type, styles: extractCSSVariables(projectPath) };
    default:
      return { type: 'unknown', styles: null };
  }
}

// ============ COMPARISON ALGORITHMS ============

function compareColors(projectColors, referenceColors) {
  const results = { exact: [], similar: [], missing: [], extra: [], score: 0 };

  const refPalette = referenceColors.palette?.map(c => c.value) || [];
  const refSemantic = [
    ...(referenceColors.semantic?.backgrounds?.map(c => c.value) || []),
    ...(referenceColors.semantic?.text?.map(c => c.value) || []),
    ...(referenceColors.semantic?.borders?.map(c => c.value) || []),
    ...(referenceColors.semantic?.accents?.map(c => c.value) || [])
  ];
  const allRefColors = [...new Set([...refPalette, ...refSemantic])].filter(Boolean);

  const projectColorValues = Object.values(projectColors).filter(Boolean);
  const matchedRef = new Set();

  for (const projColor of projectColorValues) {
    let found = false;

    // Check exact match
    for (const refColor of allRefColors) {
      if (projColor.toLowerCase() === refColor.toLowerCase()) {
        results.exact.push({ project: projColor, reference: refColor });
        matchedRef.add(refColor);
        found = true;
        break;
      }
    }

    if (!found) {
      // Check similar (ΔE 2000 < 5)
      for (const refColor of allRefColors) {
        if (matchedRef.has(refColor)) continue;
        const de = deltaE(projColor, refColor);
        if (de < 5) {
          results.similar.push({ project: projColor, reference: refColor, deltaE: de.toFixed(2) });
          matchedRef.add(refColor);
          found = true;
          break;
        }
      }
    }

    if (!found) {
      results.extra.push(projColor);
    }
  }

  // Find missing reference colors
  for (const refColor of allRefColors) {
    if (!matchedRef.has(refColor)) {
      results.missing.push(refColor);
    }
  }

  // Calculate score
  const total = allRefColors.length || 1;
  results.score = Math.round(((results.exact.length + results.similar.length * 0.8) / total) * 100);

  return results;
}

function compareTypography(projectFonts, referenceTypography) {
  const results = { matched: [], missing: [], extra: [], score: 0 };

  const refFonts = (referenceTypography.fontFamilies || []).map(f =>
    (typeof f === 'string' ? f : f.family).toLowerCase()
  );
  const projFonts = projectFonts.map(f => f.toLowerCase());

  for (const proj of projFonts) {
    const match = refFonts.find(ref =>
      ref.includes(proj) || proj.includes(ref) ||
      ref.split(' ')[0] === proj.split(' ')[0]
    );
    if (match) {
      results.matched.push({ project: proj, reference: match });
    } else {
      results.extra.push(proj);
    }
  }

  for (const ref of refFonts) {
    if (!results.matched.find(m => m.reference === ref)) {
      results.missing.push(ref);
    }
  }

  const total = refFonts.length || 1;
  results.score = Math.round((results.matched.length / total) * 100);

  return results;
}

function compareSpacing(projectSpacing, referenceSpacing) {
  const results = { matched: [], close: [], missing: [], extra: [], score: 0 };

  const parseValue = (v) => {
    if (typeof v === 'number') return v;
    const match = String(v).match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
  };

  const refScale = (referenceSpacing.scale || []).map(parseValue).filter(v => v !== null);
  const projScale = projectSpacing.map(parseValue).filter(v => v !== null);

  const matchedRef = new Set();

  for (const proj of projScale) {
    let found = false;

    // Exact match
    for (const ref of refScale) {
      if (proj === ref) {
        results.matched.push({ project: `${proj}px`, reference: `${ref}px` });
        matchedRef.add(ref);
        found = true;
        break;
      }
    }

    if (!found) {
      // Close match (within 2px)
      for (const ref of refScale) {
        if (matchedRef.has(ref)) continue;
        if (Math.abs(proj - ref) <= 2) {
          results.close.push({ project: `${proj}px`, reference: `${ref}px`, diff: `${Math.abs(proj - ref)}px` });
          matchedRef.add(ref);
          found = true;
          break;
        }
      }
    }

    if (!found) {
      results.extra.push(`${proj}px`);
    }
  }

  for (const ref of refScale) {
    if (!matchedRef.has(ref)) {
      results.missing.push(`${ref}px`);
    }
  }

  const total = refScale.length || 1;
  results.score = Math.round(((results.matched.length + results.close.length * 0.7) / total) * 100);

  return results;
}

function compareBorderRadius(projectRadius, referenceRadius) {
  const results = { matched: [], missing: [], extra: [], score: 0 };

  const parseValue = (v) => {
    if (typeof v === 'object') return parseFloat(v.value) || null;
    const match = String(v).match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
  };

  const refValues = (referenceRadius || []).map(parseValue).filter(v => v !== null);
  const projValues = projectRadius.map(parseValue).filter(v => v !== null);

  for (const proj of projValues) {
    if (refValues.includes(proj)) {
      results.matched.push(`${proj}px`);
    } else {
      results.extra.push(`${proj}px`);
    }
  }

  for (const ref of refValues) {
    if (!projValues.includes(ref)) {
      results.missing.push(`${ref}px`);
    }
  }

  const total = refValues.length || 1;
  results.score = Math.round((results.matched.length / total) * 100);

  return results;
}

// ============ REPORT GENERATION ============

function generateReport(projectPath, reference, projectType, comparisons, accessibilityAudit) {
  const lines = [];
  const overallScore = Math.round(
    (comparisons.colors.score + comparisons.typography.score +
     comparisons.spacing.score + comparisons.borderRadius.score) / 4
  );

  lines.push(`# Design System Comparison Report`);
  lines.push('');
  lines.push(`**Project:** \`${projectPath}\``);
  lines.push(`**Reference:** ${reference.meta?.url || 'Unknown'}`);
  lines.push(`**Project Type:** ${projectType}`);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Color Algorithm:** CIE ΔE 2000`);
  lines.push('');
  lines.push(`## Overall Alignment Score: ${overallScore}%`);
  lines.push('');
  lines.push(`| Category | Score | Status |`);
  lines.push(`|----------|-------|--------|`);
  lines.push(`| Colors | ${comparisons.colors.score}% | ${comparisons.colors.score >= 80 ? '✅' : comparisons.colors.score >= 50 ? '⚠️' : '❌'} |`);
  lines.push(`| Typography | ${comparisons.typography.score}% | ${comparisons.typography.score >= 80 ? '✅' : comparisons.typography.score >= 50 ? '⚠️' : '❌'} |`);
  lines.push(`| Spacing | ${comparisons.spacing.score}% | ${comparisons.spacing.score >= 80 ? '✅' : comparisons.spacing.score >= 50 ? '⚠️' : '❌'} |`);
  lines.push(`| Border Radius | ${comparisons.borderRadius.score}% | ${comparisons.borderRadius.score >= 80 ? '✅' : comparisons.borderRadius.score >= 50 ? '⚠️' : '❌'} |`);
  lines.push('');

  // Accessibility section
  if (accessibilityAudit) {
    lines.push(`## Accessibility Audit (WCAG 2.1)`);
    lines.push('');

    const errors = accessibilityAudit.issues.filter(i => i.severity === 'error');
    const warnings = accessibilityAudit.issues.filter(i => i.severity === 'warning');

    if (errors.length === 0 && warnings.length === 0) {
      lines.push(`✅ All tested color combinations pass WCAG AA requirements.`);
    } else {
      if (errors.length > 0) {
        lines.push(`### ❌ Contrast Errors (${errors.length})`);
        lines.push('');
        lines.push(`| Foreground | Background | Ratio | Issue |`);
        lines.push(`|------------|------------|-------|-------|`);
        for (const err of errors) {
          lines.push(`| \`${err.foreground}\` | \`${err.background}\` | ${err.ratio}:1 | ${err.message} |`);
        }
        lines.push('');
      }

      if (warnings.length > 0) {
        lines.push(`### ⚠️ Contrast Warnings (${warnings.length})`);
        lines.push('');
        for (const warn of warnings) {
          lines.push(`- \`${warn.foreground}\` on \`${warn.background}\`: ${warn.message}`);
        }
        lines.push('');
      }
    }

    if (accessibilityAudit.passing.length > 0) {
      lines.push(`### ✅ Passing Combinations (${accessibilityAudit.passing.length})`);
      lines.push('');
      for (const pass of accessibilityAudit.passing.slice(0, 5)) {
        lines.push(`- \`${pass.foreground}\` on \`${pass.background}\` (${pass.ratio}:1)`);
      }
      if (accessibilityAudit.passing.length > 5) {
        lines.push(`- ... and ${accessibilityAudit.passing.length - 5} more`);
      }
      lines.push('');
    }
  }

  // Colors section
  lines.push(`## Colors (${comparisons.colors.score}%)`);
  lines.push('');

  if (comparisons.colors.exact.length) {
    lines.push(`### ✅ Exact Matches (${comparisons.colors.exact.length})`);
    lines.push('');
    comparisons.colors.exact.forEach(c => {
      lines.push(`- \`${c.project}\``);
    });
    lines.push('');
  }

  if (comparisons.colors.similar.length) {
    lines.push(`### ⚠️ Similar Colors (${comparisons.colors.similar.length})`);
    lines.push('');
    lines.push(`| Project | Reference | ΔE 2000 |`);
    lines.push(`|---------|-----------|---------|`);
    comparisons.colors.similar.forEach(c => {
      lines.push(`| \`${c.project}\` | \`${c.reference}\` | ${c.deltaE} |`);
    });
    lines.push('');
  }

  if (comparisons.colors.missing.length) {
    lines.push(`### ❌ Missing from Project (${comparisons.colors.missing.length})`);
    lines.push('');
    comparisons.colors.missing.forEach(c => {
      lines.push(`- \`${c}\``);
    });
    lines.push('');
  }

  if (comparisons.colors.extra.length) {
    lines.push(`### ➕ Extra in Project (${comparisons.colors.extra.length})`);
    lines.push('');
    comparisons.colors.extra.slice(0, 10).forEach(c => {
      lines.push(`- \`${c}\``);
    });
    if (comparisons.colors.extra.length > 10) {
      lines.push(`- ... and ${comparisons.colors.extra.length - 10} more`);
    }
    lines.push('');
  }

  // Typography section
  lines.push(`## Typography (${comparisons.typography.score}%)`);
  lines.push('');

  if (comparisons.typography.matched.length) {
    lines.push(`### ✅ Matched Fonts`);
    lines.push('');
    comparisons.typography.matched.forEach(f => {
      lines.push(`- **${f.project}** → ${f.reference}`);
    });
    lines.push('');
  }

  if (comparisons.typography.missing.length) {
    lines.push(`### ❌ Missing Fonts`);
    lines.push('');
    comparisons.typography.missing.forEach(f => {
      lines.push(`- ${f}`);
    });
    lines.push('');
  }

  // Spacing section
  lines.push(`## Spacing (${comparisons.spacing.score}%)`);
  lines.push('');

  if (comparisons.spacing.matched.length) {
    lines.push(`### ✅ Exact Matches: ${comparisons.spacing.matched.map(m => m.project).join(', ')}`);
    lines.push('');
  }

  if (comparisons.spacing.close.length) {
    lines.push(`### ⚠️ Close Matches`);
    lines.push('');
    comparisons.spacing.close.forEach(s => {
      lines.push(`- ${s.project} → ${s.reference} (off by ${s.diff})`);
    });
    lines.push('');
  }

  if (comparisons.spacing.missing.length) {
    lines.push(`### ❌ Missing: ${comparisons.spacing.missing.join(', ')}`);
    lines.push('');
  }

  // Border Radius section
  lines.push(`## Border Radius (${comparisons.borderRadius.score}%)`);
  lines.push('');

  if (comparisons.borderRadius.matched.length) {
    lines.push(`### ✅ Matched: ${comparisons.borderRadius.matched.join(', ')}`);
    lines.push('');
  }

  if (comparisons.borderRadius.missing.length) {
    lines.push(`### ❌ Missing: ${comparisons.borderRadius.missing.join(', ')}`);
    lines.push('');
  }

  // Recommendations
  lines.push(`## Recommendations`);
  lines.push('');

  const recommendations = [];

  if (comparisons.colors.score < 80) {
    recommendations.push(`1. **Update color palette** - ${comparisons.colors.missing.length} reference colors are missing`);
  }
  if (comparisons.typography.score < 80) {
    recommendations.push(`${recommendations.length + 1}. **Install missing fonts** - Add: ${comparisons.typography.missing.join(', ')}`);
  }
  if (comparisons.spacing.score < 80) {
    recommendations.push(`${recommendations.length + 1}. **Align spacing scale** - Consider adopting reference spacing: ${comparisons.spacing.missing.slice(0, 5).join(', ')}`);
  }
  if (comparisons.borderRadius.score < 80) {
    recommendations.push(`${recommendations.length + 1}. **Update border radius tokens** - Missing: ${comparisons.borderRadius.missing.join(', ')}`);
  }
  if (accessibilityAudit?.issues.filter(i => i.severity === 'error').length > 0) {
    recommendations.push(`${recommendations.length + 1}. **Fix accessibility issues** - ${accessibilityAudit.issues.filter(i => i.severity === 'error').length} color combinations fail WCAG AA`);
  }

  if (recommendations.length === 0) {
    lines.push('Project is well-aligned with the reference design system! Minor tweaks may improve consistency further.');
  } else {
    lines.push(...recommendations);
  }

  lines.push('');
  lines.push('---');
  lines.push(`*Generated by Impression v2.0 with CIE ΔE 2000 color matching*`);

  return lines.join('\n');
}

// ============ MAIN ============

function compareDesignSystems(projectPath, referencePath, options = {}) {
  const { includeAccessibility = true } = options;

  // Load reference
  const reference = JSON.parse(fs.readFileSync(referencePath, 'utf-8'));

  // Extract project styles
  const { type: projectType, styles: projectStyles } = extractProjectStyles(projectPath);

  if (!projectStyles) {
    throw new Error(`Could not extract styles from project at ${projectPath}`);
  }

  // Run comparisons
  const comparisons = {
    colors: compareColors(projectStyles.colors || {}, reference.colors || {}),
    typography: compareTypography(projectStyles.fonts || [], reference.typography || {}),
    spacing: compareSpacing(projectStyles.spacing || [], reference.spacing || {}),
    borderRadius: compareBorderRadius(projectStyles.borderRadius || [], reference.borderRadius || [])
  };

  // Accessibility audit
  let accessibilityAudit = null;
  if (includeAccessibility && reference.colors) {
    accessibilityAudit = auditAccessibility(reference.colors);
  }

  // Generate report
  const report = generateReport(projectPath, reference, projectType, comparisons, accessibilityAudit);

  return { projectType, comparisons, accessibilityAudit, report };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node compare-design-systems.js <project-path> <reference.json> [output.md]');
    console.error('');
    console.error('Example:');
    console.error('  node compare-design-systems.js ./my-project examples/extracted/duchateau.json');
    console.error('  node compare-design-systems.js ./my-project examples/extracted/duchateau.json comparison-report.md');
    process.exit(1);
  }

  const projectPath = path.resolve(args[0]);
  const referencePath = path.resolve(args[1]);
  const outputPath = args[2];

  if (!fs.existsSync(projectPath)) {
    console.error(`Error: Project path not found: ${projectPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(referencePath)) {
    console.error(`Error: Reference file not found: ${referencePath}`);
    process.exit(1);
  }

  try {
    const { projectType, comparisons, accessibilityAudit, report } = compareDesignSystems(projectPath, referencePath);

    console.log(`Detected project type: ${projectType}`);
    console.log(`Overall alignment: ${Math.round((comparisons.colors.score + comparisons.typography.score + comparisons.spacing.score + comparisons.borderRadius.score) / 4)}%`);

    if (accessibilityAudit) {
      const errors = accessibilityAudit.issues.filter(i => i.severity === 'error').length;
      const warnings = accessibilityAudit.issues.filter(i => i.severity === 'warning').length;
      console.log(`Accessibility: ${errors} errors, ${warnings} warnings`);
    }

    console.log('');

    if (outputPath) {
      fs.writeFileSync(outputPath, report);
      console.log(`✓ Report saved to: ${outputPath}`);
    } else {
      console.log(report);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  compareDesignSystems,
  deltaE,
  deltaE2000,
  deltaE76,
  normalizeColor,
  getContrastRatio,
  checkWCAG,
  auditAccessibility,
  hexToRgb,
  rgbToLab,
  getLuminance
};

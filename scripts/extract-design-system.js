/**
 * Design System Extractor v2.0
 * Enhanced extraction with dark/light mode detection, gradients, component patterns,
 * semantic role inference, and scroll-capture support.
 *
 * Inject this script into a page via Playwright browser_run_code or browser_evaluate
 * Returns comprehensive design tokens extracted from the live page
 */

const extractDesignSystem = (options = {}) => {
  const {
    scrollCapture = false,      // Scroll page to trigger lazy-loaded content
    captureComponents = true,   // Extract component patterns
    inferRoles = true,          // Infer semantic roles for colors
    detectThemes = true         // Detect dark/light mode themes
  } = options;

  const result = {
    meta: {
      url: window.location.href,
      title: document.title,
      extractedAt: new Date().toISOString(),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      designCharacter: '',
      detectedTheme: 'unknown' // 'light', 'dark', or 'both'
    },
    colors: {
      cssVariables: {},
      palette: [],
      semantic: { backgrounds: [], text: [], borders: [], accents: [] },
      gradients: [],
      light: null,  // Theme-specific colors if detected
      dark: null
    },
    typography: {
      fontFamilies: [],
      scale: [],
      lineHeights: [],
      letterSpacing: [],
      fontWeights: [],
      pairings: [] // Detected font pairings (heading + body)
    },
    spacing: { scale: [], grid: null, gaps: [], paddings: [], margins: [] },
    animations: { keyframes: {}, transitions: [], durations: [], easings: [] },
    components: {
      buttons: [],
      inputs: [],
      cards: [],
      navigation: [],
      modals: [],
      dropdowns: [],
      badges: [],
      alerts: []
    },
    icons: { library: null, sizes: [], colors: [] },
    breakpoints: { detected: [], containerWidths: [] },
    shadows: [],
    borderRadius: []
  };

  // ============ UTILITY FUNCTIONS ============

  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgb.startsWith('#') ? rgb : null;
    const [, r, g, b] = match;
    return '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
  };

  const parseGradient = (value) => {
    if (!value || !value.includes('gradient')) return null;
    const gradientMatch = value.match(/(linear-gradient|radial-gradient|conic-gradient)\(([^)]+)\)/);
    if (!gradientMatch) return null;

    const type = gradientMatch[1];
    const content = gradientMatch[2];
    const colors = [];

    // Extract colors from gradient
    const colorMatches = content.matchAll(/(#[a-fA-F0-9]{3,8}|rgba?\([^)]+\)|[a-z]+(?=\s|,|$))/gi);
    for (const match of colorMatches) {
      const hex = rgbToHex(match[1]) || match[1];
      if (hex && hex.startsWith('#')) colors.push(hex);
    }

    return { type, raw: value, colors };
  };

  const countOccurrences = (arr) => {
    const counts = {};
    arr.forEach(item => { if (item) counts[item] = (counts[item] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
  };

  const getLuminance = (hex) => {
    if (!hex) return 0;
    const rgb = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!rgb) return 0;
    const [r, g, b] = [1, 2, 3].map(i => {
      const c = parseInt(rgb[i], 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const isDarkColor = (hex) => getLuminance(hex) < 0.5;

  // ============ THEME DETECTION ============

  const detectTheme = () => {
    // Check for prefers-color-scheme media queries in stylesheets
    let hasDarkMediaQuery = false;
    let hasLightMediaQuery = false;

    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.type === CSSRule.MEDIA_RULE) {
            if (rule.conditionText.includes('prefers-color-scheme: dark')) hasDarkMediaQuery = true;
            if (rule.conditionText.includes('prefers-color-scheme: light')) hasLightMediaQuery = true;
          }
        }
      } catch (e) {}
    }

    // Check for theme class/attribute on html/body
    const html = document.documentElement;
    const body = document.body;
    const themeClasses = ['dark', 'light', 'theme-dark', 'theme-light'];
    const themeAttrs = ['data-theme', 'data-mode', 'data-color-scheme'];

    let currentTheme = 'unknown';

    for (const cls of themeClasses) {
      if (html.classList.contains(cls) || body.classList.contains(cls)) {
        currentTheme = cls.includes('dark') ? 'dark' : 'light';
        break;
      }
    }

    for (const attr of themeAttrs) {
      const val = html.getAttribute(attr) || body.getAttribute(attr);
      if (val) {
        currentTheme = val.includes('dark') ? 'dark' : 'light';
        break;
      }
    }

    // Infer from background color if still unknown
    if (currentTheme === 'unknown') {
      const bgColor = getComputedStyle(body).backgroundColor;
      const hex = rgbToHex(bgColor);
      if (hex) {
        currentTheme = isDarkColor(hex) ? 'dark' : 'light';
      }
    }

    result.meta.detectedTheme = (hasDarkMediaQuery && hasLightMediaQuery) ? 'both' : currentTheme;

    return { hasDarkMediaQuery, hasLightMediaQuery, currentTheme };
  };

  // ============ CSS VARIABLES & KEYFRAMES ============

  const extractCSSRules = () => {
    const cssVars = {};
    const darkVars = {};
    const lightVars = {};

    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          // Root variables
          if (rule.type === CSSRule.STYLE_RULE) {
            if (rule.selectorText === ':root' || rule.selectorText === 'html') {
              for (const prop of rule.style) {
                if (prop.startsWith('--')) cssVars[prop] = rule.style.getPropertyValue(prop).trim();
              }
            }
            // Dark theme variables
            if (rule.selectorText.includes('.dark') || rule.selectorText.includes('[data-theme="dark"]')) {
              for (const prop of rule.style) {
                if (prop.startsWith('--')) darkVars[prop] = rule.style.getPropertyValue(prop).trim();
              }
            }
            // Light theme variables
            if (rule.selectorText.includes('.light') || rule.selectorText.includes('[data-theme="light"]')) {
              for (const prop of rule.style) {
                if (prop.startsWith('--')) lightVars[prop] = rule.style.getPropertyValue(prop).trim();
              }
            }
          }

          // Keyframes
          if (rule.type === CSSRule.KEYFRAMES_RULE) {
            result.animations.keyframes[rule.name] = rule.cssText;
          }

          // Media queries for breakpoints and theme-specific vars
          if (rule.type === CSSRule.MEDIA_RULE) {
            // Breakpoints
            const bpMatches = rule.conditionText.matchAll(/\((?:min|max)-width:\s*(\d+(?:\.\d+)?)(px|em|rem)\)/g);
            for (const match of bpMatches) {
              let value = parseFloat(match[1]);
              if (match[2] === 'em' || match[2] === 'rem') value *= 16;
              result.breakpoints.detected.push(Math.round(value));
            }

            // Dark mode media query variables
            if (rule.conditionText.includes('prefers-color-scheme: dark')) {
              for (const innerRule of rule.cssRules) {
                if (innerRule.type === CSSRule.STYLE_RULE &&
                    (innerRule.selectorText === ':root' || innerRule.selectorText === 'html')) {
                  for (const prop of innerRule.style) {
                    if (prop.startsWith('--')) darkVars[prop] = innerRule.style.getPropertyValue(prop).trim();
                  }
                }
              }
            }

            // Light mode media query variables
            if (rule.conditionText.includes('prefers-color-scheme: light')) {
              for (const innerRule of rule.cssRules) {
                if (innerRule.type === CSSRule.STYLE_RULE &&
                    (innerRule.selectorText === ':root' || innerRule.selectorText === 'html')) {
                  for (const prop of innerRule.style) {
                    if (prop.startsWith('--')) lightVars[prop] = innerRule.style.getPropertyValue(prop).trim();
                  }
                }
              }
            }
          }
        }
      } catch (e) {}
    }

    result.colors.cssVariables = cssVars;
    if (Object.keys(darkVars).length > 0) result.colors.dark = { cssVariables: darkVars };
    if (Object.keys(lightVars).length > 0) result.colors.light = { cssVariables: lightVars };
  };

  // ============ SEMANTIC ROLE INFERENCE ============

  const inferColorRoles = (colorData) => {
    const roles = {
      'background-primary': null,
      'background-secondary': null,
      'text-primary': null,
      'text-secondary': null,
      'accent': null,
      'border': null,
      'success': null,
      'warning': null,
      'error': null
    };

    // Background: most common bg color
    if (colorData.bg.length > 0) {
      const bgCounts = countOccurrences(colorData.bg);
      roles['background-primary'] = bgCounts[0]?.value;
      roles['background-secondary'] = bgCounts[1]?.value;
    }

    // Text: most common text color
    if (colorData.text.length > 0) {
      const textCounts = countOccurrences(colorData.text);
      roles['text-primary'] = textCounts[0]?.value;
      roles['text-secondary'] = textCounts[1]?.value;
    }

    // Border: most common border color
    if (colorData.border.length > 0) {
      const borderCounts = countOccurrences(colorData.border);
      roles['border'] = borderCounts[0]?.value;
    }

    // Accent: from interactive elements
    if (colorData.accent.length > 0) {
      const accentCounts = countOccurrences(colorData.accent);
      roles['accent'] = accentCounts[0]?.value;
    }

    // Semantic colors by hue
    const allColors = [...new Set([...colorData.bg, ...colorData.text, ...colorData.accent])];
    for (const hex of allColors) {
      if (!hex) continue;
      const rgb = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (!rgb) continue;
      const [r, g, b] = [parseInt(rgb[1], 16), parseInt(rgb[2], 16), parseInt(rgb[3], 16)];

      // Green = success
      if (g > r * 1.3 && g > b * 1.3 && !roles['success']) {
        roles['success'] = hex;
      }
      // Red = error
      if (r > g * 1.5 && r > b * 1.5 && !roles['error']) {
        roles['error'] = hex;
      }
      // Yellow/Orange = warning
      if (r > 180 && g > 120 && g < 220 && b < 100 && !roles['warning']) {
        roles['warning'] = hex;
      }
    }

    return roles;
  };

  // ============ TYPOGRAPHY PAIRING DETECTION ============

  const detectTypographyPairings = (fontData) => {
    const pairings = [];
    const fontUsage = {};

    // Group fonts by context
    fontData.forEach(f => {
      const key = f.family;
      if (!fontUsage[key]) {
        fontUsage[key] = { heading: 0, body: 0, sizes: [] };
      }
      const size = parseFloat(f.size);
      fontUsage[key].sizes.push(size);
      if (size >= 24) fontUsage[key].heading++;
      else fontUsage[key].body++;
    });

    // Find distinct heading and body fonts
    let headingFont = null;
    let bodyFont = null;

    for (const [family, usage] of Object.entries(fontUsage)) {
      const avgSize = usage.sizes.reduce((a, b) => a + b, 0) / usage.sizes.length;
      if (usage.heading > usage.body && avgSize >= 20) {
        if (!headingFont || usage.heading > fontUsage[headingFont]?.heading) {
          headingFont = family;
        }
      } else {
        if (!bodyFont || usage.body > fontUsage[bodyFont]?.body) {
          bodyFont = family;
        }
      }
    }

    if (headingFont && bodyFont && headingFont !== bodyFont) {
      pairings.push({
        heading: headingFont,
        body: bodyFont,
        type: 'contrast' // Different fonts for heading/body
      });
    } else if (headingFont || bodyFont) {
      pairings.push({
        heading: headingFont || bodyFont,
        body: bodyFont || headingFont,
        type: 'uniform' // Same font family throughout
      });
    }

    return pairings;
  };

  // ============ COMPONENT EXTRACTION ============

  const extractComponents = () => {
    // Buttons
    document.querySelectorAll('button, [role="button"], a[class*="btn"], a[class*="button"]').forEach(el => {
      const cs = getComputedStyle(el);
      result.components.buttons.push({
        text: el.textContent?.trim().slice(0, 50),
        backgroundColor: rgbToHex(cs.backgroundColor),
        textColor: rgbToHex(cs.color),
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        border: cs.border,
        boxShadow: cs.boxShadow !== 'none' ? cs.boxShadow : null,
        classes: el.classList.toString()
      });
    });

    // Inputs
    document.querySelectorAll('input, textarea, select').forEach(el => {
      const cs = getComputedStyle(el);
      result.components.inputs.push({
        type: el.type || el.tagName.toLowerCase(),
        backgroundColor: rgbToHex(cs.backgroundColor),
        borderColor: rgbToHex(cs.borderColor),
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        fontSize: cs.fontSize,
        border: cs.border,
        classes: el.classList.toString()
      });
    });

    // Cards
    document.querySelectorAll('[class*="card"], article, [role="article"]').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.boxShadow !== 'none' || cs.border !== 'none') {
        result.components.cards.push({
          backgroundColor: rgbToHex(cs.backgroundColor),
          borderRadius: cs.borderRadius,
          padding: cs.padding,
          boxShadow: cs.boxShadow !== 'none' ? cs.boxShadow : null,
          border: cs.border !== 'none' ? cs.border : null,
          classes: el.classList.toString()
        });
      }
    });

    // Navigation
    document.querySelectorAll('nav, [role="navigation"], header').forEach(el => {
      const cs = getComputedStyle(el);
      result.components.navigation.push({
        backgroundColor: rgbToHex(cs.backgroundColor),
        padding: cs.padding,
        position: cs.position,
        height: cs.height,
        classes: el.classList.toString()
      });
    });

    // Modals/Dialogs
    document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="dialog"]').forEach(el => {
      const cs = getComputedStyle(el);
      result.components.modals.push({
        backgroundColor: rgbToHex(cs.backgroundColor),
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        boxShadow: cs.boxShadow,
        maxWidth: cs.maxWidth,
        classes: el.classList.toString()
      });
    });

    // Dropdowns
    document.querySelectorAll('[class*="dropdown"], [class*="menu"], [role="menu"]').forEach(el => {
      const cs = getComputedStyle(el);
      result.components.dropdowns.push({
        backgroundColor: rgbToHex(cs.backgroundColor),
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        boxShadow: cs.boxShadow,
        border: cs.border,
        classes: el.classList.toString()
      });
    });

    // Badges/Tags
    document.querySelectorAll('[class*="badge"], [class*="tag"], [class*="chip"], [class*="label"]').forEach(el => {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.fontSize) <= 14) { // Small text = likely badge
        result.components.badges.push({
          backgroundColor: rgbToHex(cs.backgroundColor),
          textColor: rgbToHex(cs.color),
          borderRadius: cs.borderRadius,
          padding: cs.padding,
          fontSize: cs.fontSize,
          classes: el.classList.toString()
        });
      }
    });

    // Alerts/Notifications
    document.querySelectorAll('[role="alert"], [class*="alert"], [class*="notification"], [class*="toast"]').forEach(el => {
      const cs = getComputedStyle(el);
      result.components.alerts.push({
        backgroundColor: rgbToHex(cs.backgroundColor),
        textColor: rgbToHex(cs.color),
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        border: cs.border,
        classes: el.classList.toString()
      });
    });
  };

  // ============ MAIN DOM WALKER ============

  const walkDOM = () => {
    const colorData = { bg: [], text: [], border: [], accent: [] };
    const fontData = [];
    const spacingData = { padding: [], margin: [], gap: [] };
    const shadowData = [], radiusData = [], transitionData = [], containerWidths = [];
    const gradients = [];

    document.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      const tag = el.tagName.toLowerCase();

      // Colors
      const bgColor = rgbToHex(cs.backgroundColor);
      const textColor = rgbToHex(cs.color);
      const borderColor = rgbToHex(cs.borderColor);

      if (bgColor) colorData.bg.push(bgColor);
      if (textColor) colorData.text.push(textColor);
      if (borderColor && borderColor !== bgColor) colorData.border.push(borderColor);

      // Accent colors from interactive elements
      if (['a', 'button', 'input', 'select'].includes(tag)) {
        if (bgColor && bgColor !== '#ffffff' && bgColor !== '#000000') {
          colorData.accent.push(bgColor);
        }
        if (textColor && textColor !== '#ffffff' && textColor !== '#000000' && tag === 'a') {
          colorData.accent.push(textColor);
        }
      }

      // Gradients
      const bgImage = cs.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const gradient = parseGradient(bgImage);
        if (gradient) gradients.push(gradient);
      }

      // Typography
      fontData.push({
        family: cs.fontFamily.split(',')[0].trim().replace(/['"]/g, ''),
        size: cs.fontSize,
        weight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing
      });

      // Spacing
      ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(prop => {
        if (cs[prop] && cs[prop] !== '0px') spacingData.padding.push(cs[prop]);
      });
      ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach(prop => {
        if (cs[prop] && cs[prop] !== '0px' && !cs[prop].includes('auto')) spacingData.margin.push(cs[prop]);
      });
      if (cs.gap && cs.gap !== 'normal') spacingData.gap.push(cs.gap);

      // Effects
      if (cs.boxShadow && cs.boxShadow !== 'none') shadowData.push(cs.boxShadow);
      if (cs.borderRadius && cs.borderRadius !== '0px') radiusData.push(cs.borderRadius);
      if (cs.transition && cs.transition !== 'all 0s ease 0s' && cs.transition !== 'none') {
        transitionData.push(cs.transition);
        // Extract durations and easings
        const durationMatch = cs.transition.match(/(\d+\.?\d*m?s)/g);
        const easingMatch = cs.transition.match(/(ease|ease-in|ease-out|ease-in-out|linear|cubic-bezier\([^)]+\))/g);
        if (durationMatch) result.animations.durations.push(...durationMatch);
        if (easingMatch) result.animations.easings.push(...easingMatch);
      }

      // Container widths
      if (cs.maxWidth && cs.maxWidth !== 'none') {
        const width = parseFloat(cs.maxWidth);
        if (width > 200 && width < 2000) containerWidths.push(Math.round(width));
      }
    });

    // Process collected data
    result.colors.semantic.backgrounds = countOccurrences(colorData.bg).slice(0, 20);
    result.colors.semantic.text = countOccurrences(colorData.text).slice(0, 20);
    result.colors.semantic.borders = countOccurrences(colorData.border).slice(0, 20);
    result.colors.semantic.accents = countOccurrences(colorData.accent).slice(0, 10);
    result.colors.palette = countOccurrences([...colorData.bg, ...colorData.text, ...colorData.border, ...colorData.accent]).slice(0, 30);
    result.colors.gradients = [...new Map(gradients.map(g => [g.raw, g])).values()].slice(0, 10);

    // Infer color roles
    if (inferRoles) {
      const roles = inferColorRoles(colorData);
      result.colors.palette = result.colors.palette.map(c => {
        const role = Object.entries(roles).find(([_, v]) => v === c.value)?.[0];
        return role ? { ...c, role } : c;
      });
    }

    // Typography
    const uniqueFonts = [...new Set(fontData.map(f => f.family))];
    result.typography.fontFamilies = uniqueFonts.filter(f => f && !f.includes('inherit'));
    result.typography.scale = [...new Set(fontData.map(f => f.size))].sort((a, b) => parseFloat(a) - parseFloat(b));
    result.typography.fontWeights = [...new Set(fontData.map(f => f.weight))].sort((a, b) => parseInt(a) - parseInt(b));
    result.typography.lineHeights = countOccurrences(fontData.map(f => f.lineHeight)).slice(0, 10);
    result.typography.letterSpacing = countOccurrences(fontData.map(f => f.letterSpacing)).filter(x => x.value !== 'normal').slice(0, 10);
    result.typography.pairings = detectTypographyPairings(fontData);

    // Spacing
    const allSpacing = [...spacingData.padding, ...spacingData.margin, ...spacingData.gap];
    const spacingValues = [...new Set(allSpacing)].map(s => parseFloat(s)).filter(v => v > 0 && v < 500).sort((a, b) => a - b);
    result.spacing.scale = [...new Set(spacingValues.map(v => `${v}px`))];
    result.spacing.paddings = countOccurrences(spacingData.padding).slice(0, 15);
    result.spacing.margins = countOccurrences(spacingData.margin).slice(0, 15);
    result.spacing.gaps = countOccurrences(spacingData.gap).slice(0, 10);

    // Detect grid (common spacing multiples)
    if (spacingValues.length > 3) {
      const diffs = [];
      for (let i = 1; i < Math.min(spacingValues.length, 10); i++) {
        diffs.push(spacingValues[i] - spacingValues[i - 1]);
      }
      const gridBase = countOccurrences(diffs.map(d => Math.round(d)))[0]?.value;
      if (gridBase && gridBase >= 4 && gridBase <= 16) {
        result.spacing.grid = `${gridBase}px`;
      }
    }

    // Effects
    result.shadows = countOccurrences(shadowData).slice(0, 10);
    result.borderRadius = countOccurrences(radiusData).slice(0, 10);
    result.animations.transitions = countOccurrences(transitionData).slice(0, 15);
    result.animations.durations = [...new Set(result.animations.durations)].slice(0, 5);
    result.animations.easings = [...new Set(result.animations.easings)].slice(0, 5);
    result.breakpoints.detected = [...new Set(result.breakpoints.detected)].sort((a, b) => a - b);
    result.breakpoints.containerWidths = [...new Set(containerWidths)].sort((a, b) => a - b);
  };

  // ============ ICON DETECTION ============

  const detectIcons = () => {
    const iconSignatures = [
      { name: 'lucide', selector: '[data-lucide], .lucide, svg[class*="lucide"]' },
      { name: 'heroicons', selector: '[class*="heroicon"], svg[class*="h-"][class*="w-"]' },
      { name: 'fontawesome', selector: '[class*="fa-"], .fas, .far, .fab, .fal, .fad' },
      { name: 'material', selector: '.material-icons, .material-icons-outlined, .material-symbols' },
      { name: 'phosphor', selector: '[class*="ph-"], .ph' },
      { name: 'tabler', selector: '[class*="tabler-"], .tabler-icon' },
      { name: 'feather', selector: '[data-feather], .feather' },
      { name: 'bootstrap', selector: '[class*="bi-"]' }
    ];

    for (const { name, selector } of iconSignatures) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        result.icons.library = name;

        // Collect icon sizes
        found.forEach(el => {
          const cs = getComputedStyle(el);
          const size = cs.width !== 'auto' ? cs.width : cs.fontSize;
          if (size) result.icons.sizes.push(size);
          const color = rgbToHex(cs.color) || rgbToHex(cs.fill);
          if (color) result.icons.colors.push(color);
        });

        result.icons.sizes = [...new Set(result.icons.sizes)].slice(0, 5);
        result.icons.colors = [...new Set(result.icons.colors)].slice(0, 5);
        break;
      }
    }
  };

  // ============ FONT API ============

  const extractLoadedFonts = () => {
    if (document.fonts) {
      const loadedFonts = [];
      document.fonts.forEach(font => {
        if (font.status === 'loaded') {
          loadedFonts.push({
            family: font.family.replace(/['"]/g, ''),
            weight: font.weight,
            style: font.style
          });
        }
      });

      // Dedupe and add roles
      const seen = new Set();
      result.typography.fontFamilies = loadedFonts.filter(f => {
        const key = `${f.family}-${f.weight}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map((f, i) => {
        // Infer role from font name and position
        let role = 'body';
        const name = f.family.toLowerCase();
        if (name.includes('display') || name.includes('heading') || name.includes('title')) {
          role = 'display';
        } else if (name.includes('mono') || name.includes('code')) {
          role = 'mono';
        } else if (name.includes('serif') && !name.includes('sans')) {
          role = 'serif';
        } else if (i === 0) {
          role = 'primary';
        }
        return { ...f, role };
      }).slice(0, 20);
    }
  };

  // ============ DEDUPE COMPONENTS ============

  const dedupeComponents = () => {
    const dedupe = arr => {
      const seen = new Set();
      return arr.filter(item => {
        const key = JSON.stringify(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 10);
    };

    Object.keys(result.components).forEach(key => {
      result.components[key] = dedupe(result.components[key]);
    });
  };

  // ============ DESIGN CHARACTER INFERENCE ============

  const inferDesignCharacter = () => {
    const traits = [];

    // Theme
    if (result.meta.detectedTheme === 'dark') {
      traits.push('Dark-mode');
    } else if (result.meta.detectedTheme === 'light') {
      traits.push('Light-mode');
    } else if (result.meta.detectedTheme === 'both') {
      traits.push('Dual-theme');
    }

    // Typography character
    const fonts = result.typography.fontFamilies.map(f => f.family?.toLowerCase() || f.toLowerCase());
    if (fonts.some(f => f.includes('serif') && !f.includes('sans'))) {
      traits.push('serif typography');
    }
    if (fonts.some(f => f.includes('mono'))) {
      traits.push('monospace accents');
    }
    if (fonts.some(f => f.includes('inter') || f.includes('geist') || f.includes('sf pro'))) {
      traits.push('modern sans-serif');
    }

    // Spacing
    if (result.spacing.grid) {
      traits.push(`${result.spacing.grid} grid`);
    }

    // Color character
    const bgColor = result.colors.semantic.backgrounds[0]?.value;
    if (bgColor) {
      const lum = getLuminance(bgColor);
      if (lum > 0.9) traits.push('high-contrast');
      if (lum < 0.1) traits.push('deep blacks');
    }

    // Accent color
    const accent = result.colors.semantic.accents[0]?.value;
    if (accent) {
      traits.push(`${accent} accent`);
    }

    // Animation character
    if (result.animations.easings.some(e => e.includes('cubic-bezier'))) {
      traits.push('custom easing curves');
    }

    result.meta.designCharacter = traits.join(', ');
  };

  // ============ SCROLL CAPTURE ============

  const scrollCaptureFn = async () => {
    if (!scrollCapture) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollSteps = Math.ceil(scrollHeight / viewportHeight);

    for (let i = 0; i < scrollSteps; i++) {
      window.scrollTo(0, i * viewportHeight);
      await new Promise(r => setTimeout(r, 100)); // Wait for lazy content
    }

    window.scrollTo(0, 0); // Return to top
    await new Promise(r => setTimeout(r, 200));
  };

  // ============ EXECUTE ============

  if (detectThemes) detectTheme();
  extractCSSRules();
  walkDOM();
  if (captureComponents) extractComponents();
  detectIcons();
  extractLoadedFonts();
  dedupeComponents();
  inferDesignCharacter();

  return result;
};

// Self-executing for browser injection, or export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractDesignSystem };
} else {
  extractDesignSystem();
}

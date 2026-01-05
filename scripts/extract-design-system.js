/**
 * Design System Extractor
 * Inject this script into a page via Playwright browser_run_code or browser_evaluate
 * Returns comprehensive design tokens extracted from the live page
 */

const extractDesignSystem = () => {
  const result = {
    meta: {
      url: window.location.href,
      title: document.title,
      extractedAt: new Date().toISOString(),
      viewport: { width: window.innerWidth, height: window.innerHeight }
    },
    colors: {
      cssVariables: {},
      palette: [],
      semantic: { backgrounds: [], text: [], borders: [], accents: [] }
    },
    typography: {
      fontFamilies: [],
      scale: [],
      lineHeights: [],
      letterSpacing: [],
      fontWeights: []
    },
    spacing: { scale: [], grid: null, gaps: [], paddings: [], margins: [] },
    animations: { keyframes: {}, transitions: [], durations: [], easings: [] },
    components: { buttons: [], inputs: [], cards: [], navigation: [], modals: [] },
    icons: { library: null, sizes: [], colors: [] },
    breakpoints: { detected: [], containerWidths: [] },
    shadows: [],
    borderRadius: []
  };

  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgb;
    const [, r, g, b] = match;
    return '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
  };

  const countOccurrences = (arr) => {
    const counts = {};
    arr.forEach(item => { if (item) counts[item] = (counts[item] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
  };

  // Extract CSS variables and keyframes from stylesheets
  const cssVars = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.type === CSSRule.STYLE_RULE && (rule.selectorText === ':root' || rule.selectorText === 'html')) {
          for (const prop of rule.style) {
            if (prop.startsWith('--')) cssVars[prop] = rule.style.getPropertyValue(prop).trim();
          }
        }
        if (rule.type === CSSRule.KEYFRAMES_RULE) result.animations.keyframes[rule.name] = rule.cssText;
        if (rule.type === CSSRule.MEDIA_RULE) {
          const matches = rule.conditionText.matchAll(/\((?:min|max)-width:\s*(\d+(?:\.\d+)?)(px|em|rem)\)/g);
          for (const match of matches) {
            let value = parseFloat(match[1]);
            if (match[2] === 'em' || match[2] === 'rem') value *= 16;
            result.breakpoints.detected.push(Math.round(value));
          }
        }
      }
    } catch (e) {}
  }
  result.colors.cssVariables = cssVars;

  // Walk DOM and collect computed styles
  const colorData = { bg: [], text: [], border: [], accent: [] };
  const fontData = [], spacingData = { padding: [], margin: [], gap: [] };
  const shadowData = [], radiusData = [], transitionData = [], containerWidths = [];

  document.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    
    const bgColor = rgbToHex(cs.backgroundColor);
    const textColor = rgbToHex(cs.color);
    const borderColor = rgbToHex(cs.borderColor);
    
    if (bgColor) colorData.bg.push(bgColor);
    if (textColor) colorData.text.push(textColor);
    if (borderColor && borderColor !== bgColor) colorData.border.push(borderColor);
    if (['a', 'button', 'input', 'select'].includes(tag) && bgColor && bgColor !== '#ffffff' && bgColor !== '#000000') {
      colorData.accent.push(bgColor);
    }
    
    fontData.push({
      family: cs.fontFamily.split(',')[0].trim().replace(/['"]/g, ''),
      size: cs.fontSize, weight: cs.fontWeight, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing
    });
    
    ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(prop => {
      if (cs[prop] && cs[prop] !== '0px') spacingData.padding.push(cs[prop]);
    });
    ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach(prop => {
      if (cs[prop] && cs[prop] !== '0px' && !cs[prop].includes('auto')) spacingData.margin.push(cs[prop]);
    });
    if (cs.gap && cs.gap !== 'normal') spacingData.gap.push(cs.gap);
    if (cs.boxShadow && cs.boxShadow !== 'none') shadowData.push(cs.boxShadow);
    if (cs.borderRadius && cs.borderRadius !== '0px') radiusData.push(cs.borderRadius);
    if (cs.transition && cs.transition !== 'all 0s ease 0s' && cs.transition !== 'none') transitionData.push(cs.transition);
    if (cs.maxWidth && cs.maxWidth !== 'none') {
      const width = parseFloat(cs.maxWidth);
      if (width > 200 && width < 2000) containerWidths.push(Math.round(width));
    }

    // Component extraction
    if (tag === 'button' || (tag === 'a' && el.classList.toString().includes('btn'))) {
      result.components.buttons.push({
        backgroundColor: bgColor, textColor, borderRadius: cs.borderRadius,
        padding: cs.padding, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
        border: cs.border, boxShadow: cs.boxShadow !== 'none' ? cs.boxShadow : null,
        classes: el.classList.toString()
      });
    }
    if (['input', 'textarea', 'select'].includes(tag)) {
      result.components.inputs.push({
        type: el.type || tag, backgroundColor: bgColor, borderColor,
        borderRadius: cs.borderRadius, padding: cs.padding, fontSize: cs.fontSize, border: cs.border
      });
    }
  });

  // Process collected data
  result.colors.semantic.backgrounds = countOccurrences(colorData.bg).slice(0, 20);
  result.colors.semantic.text = countOccurrences(colorData.text).slice(0, 20);
  result.colors.semantic.borders = countOccurrences(colorData.border).slice(0, 20);
  result.colors.semantic.accents = countOccurrences(colorData.accent).slice(0, 10);
  result.colors.palette = countOccurrences([...colorData.bg, ...colorData.text, ...colorData.border, ...colorData.accent]).slice(0, 30);

  const uniqueFonts = [...new Set(fontData.map(f => f.family))];
  result.typography.fontFamilies = uniqueFonts.filter(f => f && !f.includes('inherit'));
  result.typography.scale = [...new Set(fontData.map(f => f.size))].sort((a, b) => parseFloat(a) - parseFloat(b));
  result.typography.fontWeights = [...new Set(fontData.map(f => f.weight))].sort((a, b) => parseInt(a) - parseInt(b));
  result.typography.lineHeights = countOccurrences(fontData.map(f => f.lineHeight)).slice(0, 10);
  result.typography.letterSpacing = countOccurrences(fontData.map(f => f.letterSpacing)).filter(x => x.value !== 'normal').slice(0, 10);

  const allSpacing = [...spacingData.padding, ...spacingData.margin, ...spacingData.gap];
  const spacingValues = [...new Set(allSpacing)].map(s => parseFloat(s)).filter(v => v > 0 && v < 500).sort((a, b) => a - b);
  result.spacing.scale = [...new Set(spacingValues.map(v => `${v}px`))];
  result.spacing.paddings = countOccurrences(spacingData.padding).slice(0, 15);
  result.spacing.margins = countOccurrences(spacingData.margin).slice(0, 15);
  result.spacing.gaps = countOccurrences(spacingData.gap).slice(0, 10);

  result.shadows = countOccurrences(shadowData).slice(0, 10);
  result.borderRadius = countOccurrences(radiusData).slice(0, 10);
  result.animations.transitions = countOccurrences(transitionData).slice(0, 15);
  result.breakpoints.detected = [...new Set(result.breakpoints.detected)].sort((a, b) => a - b);
  result.breakpoints.containerWidths = [...new Set(containerWidths)].sort((a, b) => a - b);

  // Icon detection
  const iconSignatures = [
    { name: 'lucide', selector: '[data-lucide], .lucide' },
    { name: 'heroicons', selector: '[class*="heroicon"]' },
    { name: 'fontawesome', selector: '[class*="fa-"], .fas, .far' },
    { name: 'material', selector: '.material-icons' }
  ];
  for (const { name, selector } of iconSignatures) {
    if (document.querySelector(selector)) { result.icons.library = name; break; }
  }

  // Font API
  if (document.fonts) {
    const loadedFonts = [];
    document.fonts.forEach(font => {
      if (font.status === 'loaded') loadedFonts.push({ family: font.family.replace(/['"]/g, ''), weight: font.weight, style: font.style });
    });
    const seen = new Set();
    result.typography.fontFamilies = loadedFonts.filter(f => {
      const key = `${f.family}-${f.weight}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 20);
  }

  // Dedupe components
  const dedupe = arr => { const seen = new Set(); return arr.filter(item => { const key = JSON.stringify(item); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 10); };
  result.components.buttons = dedupe(result.components.buttons);
  result.components.inputs = dedupe(result.components.inputs);

  return result;
};

extractDesignSystem();

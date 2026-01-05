---
name: design-system-extractor
description: Extract complete design systems from live URLs, compare against existing projects, and generate implementation plans. Use when needing to (1) scrape design tokens from reference websites, (2) analyze how an existing project differs from a target design system, (3) generate style guides as JSON/Tailwind/CSS variables, (4) create feature branches with design alignment changes, or (5) reverse-engineer the styling of any website.
---

# Design System Extractor

Extract, compare, and implement design systems from any website.

## Quick Start

**Extract from URL:**
```
Extract the design system from https://linear.app
```

**Compare project to reference:**
```
Compare my project at /path/to/project against the Linear design system
```

**Generate implementation plan:**
```
Create a feature branch to align my project with the Stripe dashboard design
```

## Workflow 1: Extract Design System from URL

### Process

1. Navigate to target URL:
   ```javascript
   await browser_navigate(url);
   ```

2. Wait for full page load (fonts, animations):
   ```javascript
   await browser_wait_for({ time: 3 });
   ```

3. Capture multiple viewports for responsive patterns:
   ```javascript
   // Desktop
   await browser_resize({ width: 1920, height: 1080 });
   await browser_take_screenshot({ filename: 'desktop.png' });
   
   // Tablet
   await browser_resize({ width: 768, height: 1024 });
   
   // Mobile
   await browser_resize({ width: 375, height: 667 });
   ```

4. Inject extraction script:
   ```javascript
   const result = await browser_run_code({
     code: `(async (page) => {
       return await page.evaluate(() => {
         // Paste contents of scripts/extract-design-system.js here
       });
     })`
   });
   ```

5. Save extracted data to JSON following the schema in `templates/style-guide-schema.json`

### Output Files

- `{site-name}-design-system.json` - Complete extracted tokens
- `{site-name}-tailwind.config.js` - Generated Tailwind configuration (optional)
- `{site-name}-variables.css` - CSS custom properties (optional)

## Workflow 2: Compare Project Against Style Guide

### Process

1. Load target style guide:
   - Use pre-extracted from `examples/extracted/` OR
   - Extract fresh using Workflow 1

2. Scan project for styling approach:
   ```bash
   # Detect styling method
   ls -la tailwind.config.* 2>/dev/null    # Tailwind
   find . -name "*.css" -type f            # Plain CSS
   grep -r "styled-components" package.json # CSS-in-JS
   ```

3. Parse project styles:
   - **Tailwind**: Extract theme from `tailwind.config.*`
   - **CSS**: Parse custom properties from `:root`
   - **CSS-in-JS**: Scan for theme objects

4. Run comparison algorithm:
   - Colors: Exact match, similar (ΔE < 5), missing
   - Typography: Font family, scale alignment
   - Spacing: Grid system compliance
   - Animations: Timing patterns

5. Generate diff report using `templates/comparison-report.template.md`

### Comparison Categories

| Category | Match Types | Threshold |
|----------|-------------|-----------|
| Colors | Exact, Similar, Missing | ΔE < 5 for similar |
| Fonts | Family, Weight, Scale | Family match required |
| Spacing | Grid alignment | Within 2px |
| Animations | Duration, Easing | Exact match |

## Workflow 3: Implement Design Changes

### Process

1. Generate implementation plan from comparison diff

2. Create feature branch:
   ```bash
   git checkout -b feature/design-system-alignment
   ```

3. Execute changes by priority:
   - **P0**: Design tokens (CSS vars / Tailwind theme)
   - **P1**: Typography (fonts, scale, weights)
   - **P2**: Color palette
   - **P3**: Spacing adjustments
   - **P4**: Animation refinements
   - **P5**: Component-specific updates

4. Commit atomically per category:
   ```bash
   git commit -m "design: update color palette to match target system"
   git commit -m "design: align typography scale with reference"
   ```

5. Generate PR description with before/after screenshots

## Pre-Extracted References

Skip live extraction for commonly referenced designs:

| Design System | File | Notes |
|--------------|------|-------|
| Linear | `examples/extracted/linear.json` | Clean, minimal SaaS |
| Stripe Dashboard | `examples/extracted/stripe-dashboard.json` | Data-dense, professional |
| Vercel | `examples/extracted/vercel.json` | Developer-focused |
| Notion | `examples/extracted/notion.json` | Content-focused |

## Generating Output Files

### Tailwind Config

Transform extracted JSON to Tailwind config:

```javascript
// From extracted colors
theme: {
  colors: {
    primary: extractedColors.semantic.accents[0]?.value,
    background: extractedColors.semantic.backgrounds[0]?.value,
    foreground: extractedColors.semantic.text[0]?.value,
    // ... map remaining
  },
  fontFamily: {
    sans: extractedTypography.fontFamilies.map(f => f.family),
  },
  spacing: {
    // Map from extracted spacing scale
  }
}
```

### CSS Variables

Transform to CSS custom properties:

```css
:root {
  /* Colors */
  --color-primary: #extracted-value;
  --color-background: #extracted-value;
  
  /* Typography */
  --font-sans: "Extracted Font", system-ui;
  --font-size-sm: extracted-scale[0];
  
  /* Spacing */
  --spacing-unit: extracted-grid;
}
```

## Limitations

- **Cross-origin stylesheets**: May be inaccessible due to CORS
- **CSS-in-JS runtime styles**: Require page interaction to trigger all states
- **Protected sites**: Some sites block automated access
- **Dynamic content**: May need to scroll/interact to capture all styles

### Workarounds

- For protected sites: Manual inspection or saved HTML
- For dynamic content: Scroll page before extraction
- For CSS-in-JS: Interact with components to trigger style injection

## Script Reference

### extract-design-system.js

Location: `scripts/extract-design-system.js`

Injects into page context and returns comprehensive design tokens:
- Colors (variables, palette, semantic groupings)
- Typography (families, scale, weights, line-heights)
- Spacing (scale, detected grid system)
- Animations (keyframes, transitions, durations, easings)
- Components (buttons, inputs, cards patterns)
- Icons (library detection, sizes)
- Breakpoints (media queries, container widths)
- Shadows and border-radius patterns

### Usage via Playwright

```javascript
// Read the script
const scriptContent = await readFile('scripts/extract-design-system.js');

// Execute in page context
const designSystem = await browser_run_code({
  code: `async (page) => {
    return await page.evaluate(() => {
      ${scriptContent}
    });
  }`
});
```

---
name: impression
description: |
  Extract complete design systems from live websites, compare against existing projects, and generate implementation plans with atomic commits. Use this skill when the user wants to:

  **Extraction triggers:** "scrape styles", "extract design", "grab the CSS", "get the design system", "reverse-engineer the styling", "pull the theme from", "what fonts/colors does [site] use", "analyze the design of", "extract from URL"

  **Comparison triggers:** "compare my styles", "how close is my design to", "match [reference] design", "align with [brand] styling", "design system diff", "design alignment", "style comparison"

  **Generation triggers:** "generate tailwind config", "create CSS variables", "convert to tailwind", "implementation plan", "apply [site] design", "generate shadcn theme", "export to figma", "W3C tokens", "style dictionary"

  **Blending/Migration triggers:** "blend design systems", "merge styles", "combine designs", "migrate tokens", "convert tokens", "token format"

  **Pre-extracted references:** Linear design, Vercel design, DuChateau design, Sorrel design

  Outputs JSON, Tailwind config, CSS variables, shadcn/ui themes, W3C Design Tokens, Figma Variables, or Style Dictionary format. Compares using CIE ΔE 2000 perceptual color matching with WCAG accessibility audits.
---

# Impression

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
Create a feature branch to align my project with the DuChateau design
```

**Generate token formats:**
```
Generate a shadcn theme from the Vercel design system
Convert the Linear design to W3C tokens format
```

## Workflow 1: Extract Design System from URL

### Process

1. Navigate to target URL:
   ```javascript
   await browser_navigate({ url: 'https://example.com' });
   ```

2. Wait for full page load (fonts, animations):
   ```javascript
   await browser_wait_for({ time: 3 });
   ```

3. Capture multiple viewports for responsive patterns:
   ```javascript
   await browser_resize({ width: 1920, height: 1080 });
   await browser_take_screenshot({ filename: 'desktop.png' });
   await browser_resize({ width: 768, height: 1024 });
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

5. Save extracted data to JSON following the schema in `assets/style-guide-schema.json`

### Output Files

- `{site-name}-design-system.json` - Complete extracted tokens
- Optional: Tailwind config, CSS variables, shadcn theme, W3C tokens, Figma variables

## Workflow 2: Compare Project Against Style Guide

### Quick Start

```bash
node scripts/compare-design-systems.js /path/to/project references/duchateau.json
node scripts/compare-design-systems.js /path/to/project references/duchateau.json comparison.md
```

### Comparison Algorithms

| Category | Algorithm | Match Criteria |
|----------|-----------|----------------|
| Colors | CIE ΔE 2000 | Exact: ΔE = 0, Similar: ΔE < 5, Different: ΔE ≥ 5 |
| Contrast | WCAG 2.1 | AAA: ≥7:1, AA: ≥4.5:1, AA-large: ≥3:1 |
| Typography | Fuzzy string match | Font family name contains/contained by reference |
| Spacing | Numeric diff | Exact: 0px diff, Close: ≤2px diff |
| Border Radius | Exact match | Pixel value equality |

### Output

Report includes overall alignment score, per-category scores, WCAG accessibility audit, and actionable recommendations.

## Workflow 3: Implement Design Changes

### Quick Start

```bash
# Preview what would change
node scripts/implement-design-changes.js /path/to/project references/duchateau.json --dry-run

# Execute (creates branch, modifies configs, generates plan)
node scripts/implement-design-changes.js /path/to/project references/duchateau.json
```

### Process

1. Runs comparison to identify gaps
2. Detects config files (tailwind.config.js or CSS variables)
3. Generates prioritized tokens
4. Creates feature branch `feature/design-system-alignment`
5. **Modifies config files directly** with backup
6. Outputs implementation plan

### Priority Order

| Priority | Category | Description |
|----------|----------|-------------|
| P0 | Colors | Design tokens foundation |
| P1 | Typography | Font families, size scale, weights |
| P2 | Spacing | Spacing scale values |
| P3 | Border Radius | Corner radius tokens |
| P4 | Animations | Durations and easing functions |

## Workflow 4: Generate Token Formats

```bash
# Tailwind config
node scripts/generate-tailwind-config.js site-design.json tailwind.config.js

# CSS variables
node scripts/generate-css-variables.js site-design.json variables.css

# shadcn/ui theme (HSL format)
node scripts/generate-shadcn-theme.js site-design.json --format=css

# W3C Design Tokens
node scripts/generate-w3c-tokens.js site-design.json tokens.json

# Figma Variables
node scripts/generate-figma-tokens.js site-design.json --format=figma

# Style Dictionary
node scripts/generate-w3c-tokens.js site-design.json --format=sd
```

## Workflow 5: Blend Design Systems

Merge multiple design systems into a hybrid:

```bash
# Equal blend
node scripts/blend-design-systems.js linear.json vercel.json blended.json

# Weighted blend (60% Linear, 40% Vercel)
node scripts/blend-design-systems.js linear.json vercel.json --weights=60,40

# Prefer first system, fill gaps from others
node scripts/blend-design-systems.js linear.json vercel.json --strategy=prefer
```

## Workflow 6: Migrate Between Formats

Convert tokens between different standards:

```bash
# Impression to W3C
node scripts/migrate-tokens.js design.json --from=impression --to=w3c

# W3C to Tailwind
node scripts/migrate-tokens.js tokens.json --from=w3c --to=tailwind

# Figma to CSS
node scripts/migrate-tokens.js figma.json --from=figma --to=css
```

Supported formats: `impression`, `w3c`, `sd` (Style Dictionary), `figma`, `tailwind`, `css`, `shadcn`

## Workflow 7: CI/CD Integration

```bash
# GitHub Actions format
node scripts/ci-compare.js . ./reference.json --format=github

# GitLab CI format
node scripts/ci-compare.js . ./reference.json --format=gitlab --threshold=90
```

Exit codes: 0 = pass, 1 = critical issues, 2 = warnings

## Pre-Extracted References

| Design System | File | Notes |
|--------------|------|-------|
| DuChateau | `references/duchateau.json` | Luxury editorial, serif typography, warm neutrals |
| Linear | `references/linear.json` | Dark-mode SaaS, Inter Variable, indigo accent |
| Vercel | `references/vercel.json` | Developer platform, Geist font, blue accent |
| Sorrel | `references/sorrel.json` | Light-mode cooking app, Söhne + Novarese, cream |

## Limitations

- **Cross-origin stylesheets**: May be inaccessible due to CORS
- **CSS-in-JS**: Require page interaction to trigger runtime styles
- **Protected sites**: Some sites block automated access
- **Dynamic content**: May need scrolling to capture all styles

### Workarounds

- For protected sites: Manual inspection or saved HTML
- For dynamic content: Scroll page before extraction
- For CSS-in-JS: Interact with components to trigger style injection

# CLAUDE.md

Project context for Claude Code when working with this repository.

## Project Overview

**Impression** is a Claude Code skill that extracts design systems from live websites using Playwright browser automation. It outputs structured JSON, generates Tailwind configs or CSS variables, compares projects against reference designs using perceptually accurate color matching (CIE ΔE 2000), and creates prioritized implementation plans.

**Zero dependencies** — vanilla Node.js scripts, no package.json, no build step.

## Quick Reference

| Script | Purpose | Key Function |
|--------|---------|--------------|
| `extract-design-system.js` | Browser injection | `extractDesignSystem()` |
| `compare-design-systems.js` | Project diff | `compareDesignSystems(projectPath, refPath)` |
| `implement-design-changes.js` | Plan generator | `generateImplementationPlan()`, `executePlan()` |
| `generate-tailwind-config.js` | JSON→Tailwind | `generateTailwindConfig(json)` |
| `generate-css-variables.js` | JSON→CSS | `generateCSSVariables(json)` |

## Commands

```bash
# Compare project styles against a reference design system
node scripts/compare-design-systems.js <project-path> <reference.json> [output.md]

# Generate implementation plan with feature branch
node scripts/implement-design-changes.js <project-path> <reference.json> [--dry-run]

# Generate Tailwind config from extracted JSON
node scripts/generate-tailwind-config.js <design-system.json> [output.js]

# Generate CSS variables from extracted JSON
node scripts/generate-css-variables.js <design-system.json> [output.css]
```

## Live Extraction Workflow

The core use case is extracting from a live URL via Playwright MCP tools:

```javascript
// 1. Navigate to target
await browser_navigate({ url: 'https://example.com' });

// 2. Wait for fonts/animations to load
await browser_wait_for({ time: 3 });

// 3. Read the extraction script
const scriptContent = fs.readFileSync('scripts/extract-design-system.js', 'utf8');

// 4. Inject and execute in page context
const result = await browser_run_code({
  code: `async (page) => {
    return await page.evaluate(() => {
      ${scriptContent}
    });
  }`
});

// 5. Save result to examples/extracted/{site}.json
```

## Architecture

```
scripts/
├── extract-design-system.js      # Browser-injectable, walks DOM, extracts computed styles
├── compare-design-systems.js     # CIE ΔE 2000 color matching, exports { compareDesignSystems, deltaE, normalizeColor }
├── implement-design-changes.js   # Creates feature branch, P0-P4 priority commits
├── generate-tailwind-config.js   # Transforms JSON to Tailwind theme.extend
└── generate-css-variables.js     # Transforms JSON to :root CSS custom properties
```

### Key Algorithms

- **Color Comparison**: RGB → XYZ → LAB → CIE ΔE 2000 (ΔE < 5 = perceptually similar)
- **Project Detection**: Checks for `tailwind.config.{js,ts,mjs,cjs}`, then CSS files
- **Priority System**: P0 (colors) → P1 (typography) → P2 (spacing) → P3 (border-radius) → P4 (animations)

## Pre-Extracted References

Located in `examples/extracted/`:

| File | Design Character |
|------|------------------|
| `duchateau.json` | Luxury editorial, serif typography, warm neutrals |
| `linear.json` | Dark-mode SaaS, Inter Variable, indigo accent (#5e6ad2), Berkeley Mono |
| `vercel.json` | Light-mode developer platform, Geist font, blue accent (#0070f3) |

## Extracted JSON Schema

```yaml
meta: { url, title, extractedAt, viewport, designCharacter }
colors:
  cssVariables: { --var-name: value }
  palette: [{ value, count, role? }]
  semantic: { backgrounds, text, borders, accents }
typography:
  fontFamilies: [{ family, weight, style, role? }]
  scale: ["12px", "14px", ...]
  fontWeights, lineHeights, letterSpacing
spacing: { scale, paddings, margins, gaps }
animations: { keyframes, transitions, durations, easings }
borderRadius, shadows: [{ value, count, role? }]
breakpoints: { detected, containerWidths }
components: { buttons, inputs }
icons: { library }
```

## File Purposes

| File | Purpose |
|------|---------|
| `SKILL.md` | Instructions Claude receives when skill is invoked |
| `README.md` | User-facing documentation |
| `CLAUDE.md` | This file — project context for Claude Code |
| `marketplace.json` | Plugin metadata for Claude Code marketplace |

## Development Notes

- All scripts use `require.main === module` pattern for CLI + programmatic use
- Exports are at bottom of each file via `module.exports`
- No external dependencies — uses only Node.js built-ins (`fs`, `path`, `child_process`)
- Color normalization handles hex (3/6 digit), rgb(), rgba(), and named colors

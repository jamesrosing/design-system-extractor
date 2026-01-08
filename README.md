# Impression

Extract complete design systems from any live website using Playwright browser automation. Compare projects against reference designs with perceptually accurate color matching, and generate implementation plans.

## What It Does

- **Extracts** colors, typography, spacing, animations, shadows, border-radius, breakpoints, and component patterns from any URL
- **Outputs** JSON (canonical), Tailwind config, or CSS custom properties
- **Compares** your project against extracted design systems using CIE ΔE 2000 color matching
- **Generates** prioritized implementation plans with atomic commits (P0→P4)

**Zero dependencies** — vanilla Node.js scripts, no package.json, no build step.

## Installation

### Claude Code (Recommended)

```bash
/plugin marketplace add jamesrosing/impression
```

### Manual Installation

```bash
# Personal skills
cp -r impression ~/.claude/skills/

# Project-specific
cp -r impression .claude/skills/
```

## Usage

### Extract a Design System

```
Extract the design system from https://linear.app
```

```
Scrape the styles from https://stripe.com/docs and save as JSON
```

### Compare Against a Reference

```
Compare my project at /path/to/project against the Linear design system
```

### Generate Implementation Plan

```
Create a feature branch to align my webapp with the DuChateau design
```

## CLI Commands

### Compare Project Against Reference

```bash
# Generate comparison report (prints to stdout)
node scripts/compare-design-systems.js ./my-project examples/extracted/duchateau.json

# Save to file
node scripts/compare-design-systems.js ./my-project examples/extracted/duchateau.json comparison.md
```

**Output includes:**
- Overall alignment score (0-100%)
- Per-category scores (colors, typography, spacing, border-radius)
- Exact matches, similar colors (ΔE < 5), missing tokens
- Actionable recommendations

### Generate Implementation Plan

```bash
# Preview changes (dry run)
node scripts/implement-design-changes.js ./my-project examples/extracted/duchateau.json --dry-run

# Generate plan and create feature branch
node scripts/implement-design-changes.js ./my-project examples/extracted/duchateau.json
```

**Creates:**
- Feature branch: `feature/design-system-alignment`
- `DESIGN_IMPLEMENTATION_PLAN.md` with exact tokens and git commands
- Prioritized commits: P0 (colors) → P1 (typography) → P2 (spacing) → P3 (border-radius) → P4 (animations)

### Generate Tailwind Config

```bash
node scripts/generate-tailwind-config.js examples/extracted/duchateau.json tailwind.config.js
```

### Generate CSS Variables

```bash
node scripts/generate-css-variables.js examples/extracted/duchateau.json variables.css
```

## Pre-Extracted References

Skip live extraction for these popular designs:

| Site | File | Character |
|------|------|-----------|
| DuChateau | `examples/extracted/duchateau.json` | Luxury editorial, serif typography, warm neutrals |
| Linear | `examples/extracted/linear.json` | Dark-mode SaaS, Inter Variable, indigo accent (#5e6ad2) |
| Vercel | `examples/extracted/vercel.json` | Light-mode developer platform, Geist font, blue accent (#0070f3) |

## What Gets Extracted

| Category | Details |
|----------|---------|
| **Colors** | CSS variables from `:root`, computed palette with occurrence counts, semantic groupings (backgrounds, text, borders, accents) |
| **Typography** | Font families (via Font Loading API), size scale, weights, line-heights, letter-spacing |
| **Spacing** | Scale derived from padding/margin/gap values |
| **Animations** | `@keyframes` rules, transition properties, durations, easing functions |
| **Components** | Buttons and inputs with full computed styles |
| **Layout** | Breakpoints from `@media` queries, container `max-width` values |
| **Effects** | Box shadows, border-radius patterns |
| **Icons** | Library detection (Lucide, Heroicons, FontAwesome, Material) |

## Comparison Algorithms

| Category | Algorithm | Match Criteria |
|----------|-----------|----------------|
| Colors | CIE ΔE 2000 | Exact: ΔE = 0, Similar: ΔE < 5, Different: ΔE ≥ 5 |
| Typography | Fuzzy string match | Font family name contains/contained by reference |
| Spacing | Numeric diff | Exact: 0px diff, Close: ≤2px diff |
| Border Radius | Exact match | Pixel value equality |

## Extracted JSON Schema

```yaml
meta:
  url: string
  title: string
  extractedAt: ISO timestamp
  viewport: { width, height }
  designCharacter: string (optional description)

colors:
  cssVariables: { --var-name: value }
  palette: [{ value: hex, count: number, role?: string }]
  semantic:
    backgrounds: [{ value, count }]
    text: [{ value, count }]
    borders: [{ value, count }]
    accents: [{ value, count }]

typography:
  fontFamilies: [{ family, weight, style, role? }]
  scale: ["12px", "14px", ...]
  fontWeights: ["400", "500", ...]
  lineHeights: [{ value, count }]
  letterSpacing: [{ value, count }]

spacing:
  scale: ["4px", "8px", ...]
  paddings: [{ value, count }]
  margins: [{ value, count }]
  gaps: [{ value, count }]

animations:
  keyframes: { name: cssText }
  transitions: [{ value, count }]
  durations: []
  easings: []

borderRadius: [{ value, count }]
shadows: [{ value, count }]
breakpoints:
  detected: [768, 1024, ...]
  containerWidths: [1024, ...]
components:
  buttons: [{ backgroundColor, textColor, ... }]
  inputs: [{ type, backgroundColor, ... }]
icons:
  library: "lucide" | "heroicons" | "fontawesome" | "material" | null
```

## File Structure

```
impression/
├── SKILL.md                    # Claude skill instructions
├── CLAUDE.md                   # Project context for Claude Code
├── marketplace.json            # Plugin metadata (v1.3.0)
├── README.md                   # This file
├── LICENSE                     # MIT
├── scripts/
│   ├── extract-design-system.js      # Browser injection script (193 lines)
│   ├── compare-design-systems.js     # ΔE comparison engine (661 lines)
│   ├── implement-design-changes.js   # Plan generator (426 lines)
│   ├── generate-tailwind-config.js   # JSON → Tailwind (206 lines)
│   └── generate-css-variables.js     # JSON → CSS vars (265 lines)
└── examples/
    ├── extracted/              # Pre-extracted reference designs
    │   ├── duchateau.json
    │   ├── linear.json
    │   └── vercel.json
    └── generated/              # Example generated configs
        ├── *-tailwind.config.js
        └── *-variables.css
```

## Limitations

- **Cross-origin stylesheets**: May be inaccessible due to CORS
- **CSS-in-JS**: Requires page interaction to trigger runtime style injection
- **Protected sites**: Some sites block automated browser access
- **Dynamic content**: May need scrolling/interaction to capture lazy-loaded styles

## Requirements

- Claude Code with Playwright MCP, or Claude.ai (Pro/Max/Team/Enterprise)
- Node.js (for CLI scripts)

## License

MIT

## Contributing

PRs welcome! Roadmap:

- [x] Tailwind config generator
- [x] CSS variables generator
- [x] Project comparison with CIE ΔE 2000 color matching
- [x] Implementation plan generator with atomic commits
- [x] Pre-extracted references (Linear, Vercel, DuChateau)
- [ ] More references (Stripe, Notion, Tailwind UI)
- [ ] Figma export format
- [ ] Automated PR generation with before/after screenshots
- [ ] Dark/light mode detection and dual-theme extraction
- [ ] Component pattern library extraction

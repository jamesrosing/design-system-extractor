# Design System Extractor

Extract complete design systems from any live website. Generate structured style guides, compare against existing projects, and create implementation plans.

## What It Does

- **Extracts** colors, typography, spacing, animations, shadows, border-radius, breakpoints, and component patterns from any URL
- **Outputs** JSON (canonical), Tailwind config, or CSS custom properties
- **Compares** your project against extracted design systems
- **Generates** prioritized implementation plans with atomic commits

## Installation

### Claude Code (Recommended)

```bash
/plugin marketplace add jamesrosing/design-system-extractor
```

### Manual Installation

Copy to your skills directory:

```bash
# Personal skills
cp -r design-system-extractor ~/.claude/skills/

# Project-specific
cp -r design-system-extractor .claude/skills/
```

### Claude.ai Web App

1. Go to **Settings** → **Profile** → **Custom Skills**
2. Upload the `SKILL.md` file and supporting folders

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

## Pre-Extracted References

Skip live extraction for these popular designs:

| Site | File | Character |
|------|------|-----------|
| Linear | `examples/extracted/linear.json` | Clean, minimal SaaS |
| DuChateau | `examples/extracted/duchateau.json` | Luxury editorial |

## What Gets Extracted

| Category | Details |
|----------|---------|
| **Colors** | CSS variables, computed palette, semantic groupings (backgrounds, text, borders, accents) |
| **Typography** | Font families, scale, weights, line-heights, letter-spacing |
| **Spacing** | Scale, grid detection, gaps, paddings, margins |
| **Animations** | Keyframes, transitions, durations, easings |
| **Components** | Buttons, inputs, cards (with full style properties) |
| **Layout** | Breakpoints, container widths |
| **Effects** | Shadows, border-radius patterns |
| **Icons** | Library detection (Lucide, Heroicons, FontAwesome, etc.) |

## Output Formats

### JSON (Default)

Complete structured data following the canonical schema in `templates/style-guide-schema.json`.

### Tailwind Config

```javascript
// Generated tailwind.config.js
module.exports = {
  theme: {
    colors: {
      primary: '#5e6ad2',
      background: '#0f1011',
      // ... extracted values
    }
  }
}
```

### CSS Variables

```css
:root {
  --color-primary: #5e6ad2;
  --color-background: #0f1011;
  --font-sans: "Inter Variable", system-ui;
  --spacing-unit: 4px;
  /* ... extracted values */
}
```

## File Structure

```
design-system-extractor/
├── SKILL.md                    # Main instructions
├── marketplace.json            # Plugin metadata
├── README.md                   # This file
├── scripts/
│   └── extract-design-system.js   # Browser injection script
├── templates/
│   ├── style-guide-schema.json    # JSON schema
│   ├── tailwind.config.template.js
│   ├── css-variables.template.css
│   └── comparison-report.template.md
└── examples/
    └── extracted/
        ├── linear.json
        └── duchateau.json
```

## Limitations

- **Cross-origin stylesheets**: May be inaccessible due to CORS
- **CSS-in-JS**: Requires page interaction to trigger all runtime styles
- **Protected sites**: Some sites block automated access
- **Dynamic content**: May need scrolling to capture lazy-loaded styles

## Requirements

- Claude Code, Claude.ai (Pro/Max/Team/Enterprise), or Claude API
- Playwright browser automation (for live extraction)

## License

MIT

## Contributing

PRs welcome! Ideas for improvement:

- [ ] More pre-extracted references (Stripe, Vercel, Notion)
- [ ] Figma export format
- [ ] Design token diffing algorithm
- [ ] Automated PR generation with before/after screenshots

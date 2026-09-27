# n8n-nodes-claude-code-cli logo

A sealed block. The gap that isolates the agent draws a C, and a single bridge links it to the
outside: the node's output. Signal yellow with an ink C, on every background.

## Files

| File | What it is |
|---|---|
| `claude-code-cli-logo-light.svg` / `.png` | Horizontal logo for light backgrounds (ink wordmark) |
| `claude-code-cli-logo-dark.svg` / `.png` | Horizontal logo for dark backgrounds (paper wordmark) |
| `claude-code-cli-banner.png` | 2560 x 640 banner with its own ink background, readable on any theme |
| `claude-code-cli-symbol.svg` | Symbol alone, yellow with an ink C (256 x 256 viewBox) |
| `claude-code-cli-symbol-black.svg` | One-colour black symbol, the C is a real hole |
| `claude-code-cli-symbol-white.svg` | One-colour white symbol, the C is a real hole |
| `claude-code-cli-node-icon.svg` | n8n node icon, tight crop, same file for the light and dark canvas |
| `claude-code-cli-icon.svg` | Square icon on the portfolio template (200 viewBox, 180 tile, radius 40) |
| `claude-code-cli-avatar.png` | 512 x 512 avatar on a full ink square, safe for circular crops |
| `claude-code-cli-social.png` | 1280 x 640 card: logo, tagline, runner targets |
| `favicon.svg` / `favicon.ico` | Favicon drawn on the pixel grid (16, 32 and 48 px in the `.ico`) |

## What to use where

### README (GitHub and npm)

The root `README.md` uses the header below. GitHub picks the light or dark logo from the viewer's
theme. The URLs are absolute because npm renders the README from the published package, which
only ships `dist/`; they resolve once the files are on `main`. If a renderer strips `<picture>`,
the `<img>` fallback shows the banner, which reads on both themes.

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ThomasTartrau/n8n-nodes-claude-code-cli/main/assets/logo/claude-code-cli-logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/ThomasTartrau/n8n-nodes-claude-code-cli/main/assets/logo/claude-code-cli-logo-light.png">
  <img alt="n8n-nodes-claude-code-cli" src="https://raw.githubusercontent.com/ThomasTartrau/n8n-nodes-claude-code-cli/main/assets/logo/claude-code-cli-banner.png" width="560">
</picture>
```

### n8n editor

Use `claude-code-cli-node-icon.svg` as the node icon (`icon: 'file:<name>.svg'` in the node
description, path relative to the compiled node file). The yellow tile and the ink C carry their
own contrast, so the same file works on the light and the dark canvas: no `{ light, dark }` pair
is needed. Checked on light and dark node mockups at 40 px (canvas) and 24 px (node picker).

### Portfolio (tartrau.fr project page)

- Project logo: `claude-code-cli-icon.svg`, copied to the site as `/logos/claude-code-cli.svg`.
  It follows the template of the other project logos (200 viewBox, 180 tile, radius 40).
- Project image: a screenshot of a real workflow using the node fits the other project pages
  best; `claude-code-cli-social.png` works as a fallback and as the Open Graph image.

### LinkedIn

- Project section of the profile, or a post about the node: `claude-code-cli-social.png`.

### GitHub

- Settings > General > Social preview: `claude-code-cli-social.png`. It shows in link previews
  on LinkedIn, Slack, X and others.
- Organisation or account avatar, only if one is dedicated to the project:
  `claude-code-cli-avatar.png`.

### Website or docs

`favicon.ico` and `favicon.svg`. Both are drawn on the pixel grid, not scaled down from the
master, so the C stays open at 16 px.

## Colours

| Name | HEX | RGB | Use |
|---|---|---|---|
| Signal | `#FFBE1A` | 255 190 26 | The symbol tile only |
| Ink | `#111317` | 17 19 23 | The C of the symbol, wordmark on light backgrounds, dark backgrounds |
| Paper | `#F4F3EF` | 244 243 239 | Wordmark on dark backgrounds |
| Slate | `#6B6F76` | 107 111 118 | `n8n-nodes-` on light backgrounds |
| Mist | `#9A9DA3` | 154 157 163 | `n8n-nodes-` on dark backgrounds |

The C of the colour symbol is always Ink, never the background colour, so the symbol looks the
same everywhere. Only the one-colour black and white symbols use a real hole.

## Construction

256 grid. Tile 208 with a 48 corner radius, ring 40, channel (the C) 24, core 80, bridge 32.
The wordmark is drawn letter by letter on the same logic (stroke 20, outer radius 28, inner
radius 8): it is not a font and must not be retyped. `n8n-nodes-` always sits above
`claude-code-cli`, smaller and muted, so the full package name reads in two lines.

## Rules

- Clear space around the logo: at least the ring thickness, one fifth of the tile.
- Minimum size: 16 px for the symbol (use the favicon files below 24 px), 200 px wide for the
  horizontal logo.
- Don't stretch, rotate, recolour, outline, add shadows or gradients, move the bridge, close the
  C, or place the yellow symbol on a yellow or mid-grey background.
- Don't combine the logo with the n8n, Claude or Anthropic marks. This is a community node, not
  affiliated with n8n or Anthropic.

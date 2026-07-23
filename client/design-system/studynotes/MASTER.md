# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/studynotes/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** ShelfStudy — class-organized note uploads with an AI study assistant (chat + quiz generation)
**Category:** Productivity / Education app (cream, serif "bookshelf" shell, not a landing page)
**Stack:** React + Vite (TypeScript), plain CSS with custom properties

> This file codifies the design system that already exists in
> [`src/styles/App.css`](../../src/styles/App.css). Tokens below are the
> source of truth — components should reference the CSS variables, not hardcoded hex.

---

## Global Rules

### Color Palette (Cream, brown/gold accent)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background (page) | `#faf3e7` | `--bg-primary` |
| Surface (sidebar, header) | `#f1e6d3` | `--bg-secondary` |
| Surface raised (inputs, hover) | `#e8ddc8` | `--bg-tertiary` |
| Border | `#d9cbb0` | `--border` |
| Text primary | `#3d2f1f` | `--text-primary` |
| Text secondary (body) | `#6b5842` | `--text-secondary` |
| Text muted | `#8a7355` | `--text-muted` |
| Accent (buttons, active) | `#8a6d3f` | `--accent` |
| Accent hover | `#a9835a` | `--accent-hover` |
| Accent (rgb triplet) | `138, 109, 63` | `--accent-rgb` |
| Success | `#6b8f47` | `--success` |
| Error / destructive | `#b1503f` | `--error` |
| Warning | `#c99a3e` | `--warning` |

**Color Notes:** Warm cream background with a single brown/gold accent — a
"bookshelf" feel, not a stark white app. Use accent only for primary actions and
active state — not for large fills. Status colors (success/error/warning) are
for feedback only. Focus rings and soft tinted fills reuse `--accent-rgb` at
low opacity (`rgba(var(--accent-rgb), 0.1–0.3)`) rather than a second accent
color. Maintain 4.5:1 text contrast: `--text-muted` (~3.9:1 on `--bg-primary`)
is borderline — use it only for small, non-essential labels, never body copy.

### Typography

- **Body/serif font:** `'Source Serif 4', Georgia, serif` — self-hosted variable
  font (`client/public/fonts/SourceSerif4.woff2`), no Google Fonts runtime request.
- **Heading font:** `'Lora', Georgia, 'Times New Roman', serif` — self-hosted
  (`client/public/fonts/Lora.woff2`), used on `h1`/`h2`/`h3`.
- **Body line-height:** `1.6`
- **Scale (current):** subtitle `0.75rem` (12px) · body `0.875rem`–`1rem` (14–16px)
  · section heading `1.25rem`–`1.5rem` (20–24px) · display/hero `3rem` (48px)
- **Mood:** warm, literary, unhurried — like an actual shelf of study notes, not
  a SaaS dashboard.

> Fonts are self-hosted variable fonts (one file covers the full weight range,
> `font-weight: 400 700`) — do not add a Google Fonts `<link>` or swap to a
> sans-serif system stack; the serif pairing is the core of the ShelfStudy look.

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps, inline spacing |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Card / section padding |
| `--space-xl` | `32px` | Large gaps |
| `--space-2xl` | `48px` | Section margins |

### Radius & Motion

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `8px` | Buttons, inputs, cards (matches existing) |
| `--radius-lg` | `12px` | Modals, large panels |
| `--radius-pill` | `999px` | Pills, tags, badges |
| transition | `150–300ms ease` | All hovers/state changes (existing uses `0.2s`–`0.3s`) |

### Shadow Depths (tuned for cream bg)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(61, 47, 31, 0.08)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(61, 47, 31, 0.12)` | Cards, dropdowns |
| `--shadow-lg` | `0 12px 32px rgba(61, 47, 31, 0.16)` | Modals, popovers |

Shadows are tinted with `--text-primary` brown instead of pure black — pure
black shadows read as muddy on a warm cream background.

---

## Layout: App Shell

This is a **two-pane app shell**, not a scrolling page:

```
┌────────────┬─────────────────────────────────┐
│  Sidebar   │  Content header (title + actions)│
│ (classes,  ├─────────────────────────────────┤
│ collapsible)│  Content body                   │
│            │   - Note gallery (grid of cards) │
│            │   - or Chat interface            │
└────────────┴─────────────────────────────────┘
```

- **Sidebar** (`--bg-secondary`): class list + create/rename/delete. Collapsible
  via `grid-template-columns` transition (already implemented in App.css).
- **Main content** (`--bg-primary`): header row, then body that swaps between the
  note gallery and the chat/quiz view for the selected class.
- **Empty states**: centered, with a short prompt to upload or create a class.

---

## Component Specs

### Buttons

```css
.btn-primary {
  background: var(--accent);
  color: #fff;
  padding: 10px 18px;
  border-radius: var(--radius);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background 200ms ease;
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; } /* use during async (uploads, chat) */

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 10px 18px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 200ms ease, background 200ms ease;
}
.btn-secondary:hover { border-color: var(--accent); }
```

### Cards (note tiles, class items)

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-lg);
  cursor: pointer;
  transition: border-color 200ms ease, background 200ms ease;
}
.card:hover { border-color: var(--accent); background: var(--bg-tertiary); }
```

> Prefer color/border hover over `transform: scale()` — scaling note tiles in a
> grid shifts neighbors. (See anti-patterns.)

### Inputs

```css
.input {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 14px;
  font: inherit;
  font-size: 16px; /* ≥16px prevents iOS zoom-on-focus */
}
.input::placeholder { color: var(--text-muted); }
.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.25); /* visible focus ring */
}
```

### Modals

```css
.modal-overlay { background: rgba(61, 47, 31, 0.4); backdrop-filter: blur(4px); }
.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** ShelfStudy (warm cream + brown/gold accent, serif typography)
**Key effects:** subtle border-accent on hover, smooth 200ms transitions, visible
focus rings via `--accent-rgb`, literary/bookshelf mood over flat SaaS chrome.

---

## Anti-Patterns (Do NOT Use)

- ❌ **Dark mode default** — this app is cream/light-first.
- ❌ **Sans-serif system stack** — headings use Lora, body uses Source Serif 4;
  don't fall back to `-apple-system`/`Segoe UI` for either.
- ❌ **Google Fonts `<link>` / runtime font requests** — fonts are self-hosted
  woff2 files in `client/public/fonts/`.
- ❌ **Emojis as icons** — use the line-art icon set (atom, flask, calculator,
  bar-chart, bookshelf, open-book, paw, sprout, globe, monitor) for folder/class
  icons, SVG for everything else.
- ❌ **Second accent color** — keep brown/gold as the only accent; status colors
  are for feedback only.
- ❌ **Layout-shifting hovers** — no `scale()` on grid tiles.
- ❌ **`--text-muted` for body copy** — fails contrast; small labels only.
- ❌ **Missing `cursor: pointer`** on clickable cards/rows.
- ❌ **Instant state changes** — always transition (150–300ms).
- ❌ **Buttons enabled during async** — disable upload/send buttons while requests are in flight.

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use the ShelfStudy line-art icon set or SVG)
- [ ] All icons from one consistent set, consistent sizing (24×24 viewBox)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms), no layout shift
- [ ] Text contrast ≥ 4.5:1 (watch `--text-muted` on cream bg)
- [ ] Focus states visible for keyboard navigation
- [ ] Async buttons disabled + show loading state during requests
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px (sidebar collapses on narrow)
- [ ] No horizontal scroll on mobile

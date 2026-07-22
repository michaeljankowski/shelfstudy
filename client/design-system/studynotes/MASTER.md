# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/studynotes/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** StudyNotes — class-organized note uploads with an AI study assistant (chat + quiz generation)
**Category:** Productivity / Education app (dark-mode app shell, not a landing page)
**Stack:** React + Vite (TypeScript), plain CSS with custom properties

> This file codifies the design system that already exists in
> [`src/styles/App.css`](../../src/styles/App.css). Tokens below are the
> source of truth — components should reference the CSS variables, not hardcoded hex.

---

## Global Rules

### Color Palette (Dark, purple accent)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background (page) | `#0a0a0f` | `--bg-primary` |
| Surface (sidebar, header) | `#12121a` | `--bg-secondary` |
| Surface raised (inputs, hover) | `#1a1a26` | `--bg-tertiary` |
| Border | `#2a2a3d` | `--border` |
| Text primary | `#e8e8f0` | `--text-primary` |
| Text secondary (body) | `#a0a0c0` | `--text-secondary` |
| Text muted | `#6b6b8a` | `--text-muted` |
| Accent (buttons, active) | `#844bd9` | `--accent` |
| Accent hover | `#a343d7` | `--accent-hover` |
| Success | `#44df77` | `--success` |
| Error / destructive | `#ff6b6b` | `--error` |
| Warning | `#f9ca24` | `--warning` |

**Color Notes:** Deep near-black background with a single purple accent. Use accent
only for primary actions and active state — not for large fills. Status colors
(success/error/warning) are for feedback only. Maintain 4.5:1 text contrast:
`--text-muted` (#6b6b8a) is borderline on `--bg-primary` — use it only for small,
non-essential labels, never body copy.

### Typography

- **Font:** System stack — `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`
- **Body line-height:** `1.6`
- **Scale (current):** body `0.875rem` (14px) · subtitle `0.75rem` (12px) · section heading `1.5rem` (24px) · brand `1.25rem` (20px)
- **Mood:** clean, focused, neutral — content (the notes) is the hero, the chrome stays quiet.

> Keeping the system font is intentional: zero load cost, native feel, no FOUT.
> If a more branded feel is wanted later, **Inter** is the lowest-risk upgrade
> (near-identical metrics). Do **not** introduce a monospace heading font — it
> reads as "code editor," wrong for study notes.

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
| transition | `150–300ms ease` | All hovers/state changes (existing uses `0.2s`–`0.3s`) |

### Shadow Depths (tuned for dark bg)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.5)` | Cards, dropdowns |
| `--shadow-lg` | `0 12px 32px rgba(0,0,0,0.6)` | Modals, popovers |

On a near-black background, lean on **borders and surface elevation**
(`--bg-secondary` → `--bg-tertiary`) more than shadows to separate layers.

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
  box-shadow: 0 0 0 3px rgba(132, 75, 217, 0.25); /* visible focus ring */
}
```

### Modals

```css
.modal-overlay { background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
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

**Style:** Dark Mode (deep near-black + single purple accent)
**Key effects:** subtle border-accent on hover, smooth 200ms transitions, visible
focus rings, low white emission for long reading sessions.

---

## Anti-Patterns (Do NOT Use)

- ❌ **Light mode default** — this app is dark-first.
- ❌ **Emojis as icons** — current code uses `📚` for the empty state ([App.tsx](../../src/App.tsx)); replace with an SVG (Lucide/Heroicons). Applies to all UI glyphs.
- ❌ **Second accent color** — keep purple as the only accent; status colors are for feedback only.
- ❌ **Layout-shifting hovers** — no `scale()` on grid tiles.
- ❌ **`--text-muted` for body copy** — fails contrast; small labels only.
- ❌ **Missing `cursor: pointer`** on clickable cards/rows.
- ❌ **Instant state changes** — always transition (150–300ms).
- ❌ **Buttons enabled during async** — disable upload/send buttons while requests are in flight.

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG: Lucide/Heroicons)
- [ ] All icons from one consistent set, consistent sizing (24×24 viewBox)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms), no layout shift
- [ ] Text contrast ≥ 4.5:1 (watch `--text-muted` on dark bg)
- [ ] Focus states visible for keyboard navigation
- [ ] Async buttons disabled + show loading state during requests
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px (sidebar collapses on narrow)
- [ ] No horizontal scroll on mobile

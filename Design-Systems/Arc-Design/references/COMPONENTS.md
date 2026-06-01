# Component patterns

HTML/CSS patterns using Arc tokens. Map to React components in Pilot/Templates; align with shadcn when introduced in Phase 5.

---

## Button

### Primary (commerce CTA)

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 var(--space-6);
  font: 600 var(--text-label-size) / 1.4 var(--font-sans);
  color: var(--btn-primary-fg);       /* #ffffff */
  background: var(--btn-primary-bg);  /* accent */
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--duration-fast);
}
.btn-primary:hover {
  background: var(--btn-primary-hover);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

### Secondary (ghost)

```css
.btn-secondary {
  min-height: 44px;
  padding: 0 var(--space-6);
  color: var(--color-text-primary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
```

---

## Card

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: var(--space-6);
}
```

---

## Input / Select

```css
.input {
  width: 100%;
  min-height: 44px;
  padding: 0 var(--space-4);
  font: 400 var(--text-body-size) / 1.5 var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: var(--focus-ring);
}
```

---

## Badge

```css
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  font: 600 12px / 1.2 var(--font-sans);
  border-radius: var(--radius-sm);
}
.badge--sale { background: var(--color-danger); color: #fff; }
.badge--stock { background: var(--color-success); color: #fff; }
```

---

## Nav link

```css
.nav-link {
  color: var(--color-text-primary);
  text-decoration: none;
  font-weight: 500;
}
.nav-link:hover,
.nav-link[aria-current="page"] {
  color: var(--color-accent);
}
```

---

## Alert (inline error)

```css
.alert--error {
  padding: var(--space-4);
  background: color-mix(in srgb, var(--color-danger) 12%, transparent);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
}
```

---

## Cart badge

```css
.cart-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: var(--color-accent);
  border-radius: 999px;
}
```

Show only when count > 0.

---

## shadcn mapping (future)

When shadcn is added to Pilot:

| shadcn | Arc token |
|--------|-----------|
| `--primary` | `--color-accent` |
| `--primary-foreground` | `--btn-primary-fg` |
| `--background` | `--color-background` |
| `--foreground` | `--color-text-primary` |
| `--muted` | `--color-surface` |
| `--border` | `--color-border` |
| `--destructive` | `--color-danger` |

Configure in `globals.css` after importing `arc-tokens.css`.

# Motion

Subtle, purposeful motion. Commerce UI should feel responsive, not flashy.

---

## Durations

| Token | Value | Use |
|-------|-------|-----|
| `--duration-fast` | 150ms | Hover, focus, button state |
| `--duration-normal` | 300ms | Drawers, modals, section reveals |
| `--duration-slow` | 500ms | Page transitions (sparingly) |

**Easing:** `ease-out` for entrances; `ease-in-out` for toggles.

---

## Allowed animations

- Button background color on hover
- Cart drawer slide-in from right
- Opacity fade for loading skeletons
- Focus ring appearance (no scale on focus for a11y)

---

## Avoid

- Parallax on product images
- Bounce/elastic on CTAs
- Auto-playing carousels without pause control
- Layout shift from animated height (prefer opacity + fixed min-height)

---

## Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Include in app global CSS when using transitions beyond token defaults.

---

## Cart optimistic UI

Prefer **instant** qty/line updates without animation delay. On error, snap back with alert — no celebratory motion.

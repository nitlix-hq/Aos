# Aos — Implementation & Extension Guide

This document is for AI agents and contributors who need to deeply understand Aos's internals, add new features, or modify existing behaviour.

## Architecture overview

```
src/
├── exports.ts          # Public entry point (re-exports init)
├── types.ts            # Config interface
└── lib/
    └── init.ts         # Core initialisation and observer logic
```

The library has **zero runtime dependencies**. It uses only the DOM, `IntersectionObserver`, and standard Web APIs. TypeScript is the only peer dependency (for `.d.ts` generation).

Build output goes to `dist/` via `tsc`. The package ships ESM only (`"type": "module"`).

## Core concepts

### Initialisation flow

`init(config?)` is the single entry point. It performs the following steps in order:

1. **Merge defaults** — destructures `config` with sensible defaults (`duration: 1000`, `easing: "ease-in-out"`, `delay: 0`, `mirror: false`, etc.).

2. **Check disable condition** — evaluates `disableInitFunc()` if provided, otherwise checks `mobile` user agent detection and `minWindowWidth`. If disabled, strips all `data-aos`-related attributes from every `[data-aos]` element and returns a no-op `destroy()`.

3. **Scan the DOM** — queries all `[data-aos]` elements.

4. **For each element:**
   - Resolves the anchor element (the element itself, or the one specified by `data-aos-anchor`).
   - Creates an `IntersectionObserver` with `rootMargin` derived from `offsetEnter` and `offsetExit`.
   - On intersection: adds `aos-animate` class and fires the callback with `"enter"`.
   - On exit (only if `mirror` is `true`): removes `aos-animate` class and fires the callback with `"exit"`.
   - Adds `aos-init` class.
   - Sets `data-aos-duration`, `data-aos-easing`, and `data-aos-delay` attributes **only if** the element doesn't already have them (preserving per-element overrides).
   - Tracks which attributes were added so `destroy()` can cleanly remove only those.

5. **Returns `{ destroy }`** — a cleanup function that disconnects all observers, removes all added classes and attributes, and clears internal state.

### Disable logic

When Aos is disabled (either by `disableInitFunc`, mobile detection, or `minWindowWidth`), it removes the following attributes from all `[data-aos]` elements:

- `data-aos`
- `data-aos-easing`
- `data-aos-duration`
- `data-aos-delay`

This ensures elements render in their final visible state with no animation artefacts.

The `disableInitFunc` takes priority. If it's not provided, the fallback logic checks:
1. `mobile === true` AND the user agent matches a mobile pattern → disable.
2. `window.innerWidth < minWindowWidth` → disable.

### Observer setup

Each `[data-aos]` element gets its own `IntersectionObserver` instance. This is intentional — each element may have a different anchor, and the observer is configured with `rootMargin` based on the global `offsetEnter`/`offsetExit` values:

```
rootMargin: `${offsetEnter}px 0px ${offsetExit * -1}px 0px`
```

- `offsetEnter` adds positive top margin (triggers earlier as element approaches from below).
- `offsetExit` is negated for the bottom margin (triggers earlier as element leaves upward).

### Anchor resolution

`data-aos-anchor` accepts a CSS selector string. The resolver:
1. Reads the attribute value.
2. Attempts `document.querySelector(anchorString)`.
3. If the selector is invalid (throws) or returns `null`, falls back to the element itself.

The **anchor** is the element observed by `IntersectionObserver`, but the **animated element** is always the `[data-aos]` element itself.

### Class lifecycle

| Class          | When added           | When removed                  |
| -------------- | -------------------- | ----------------------------- |
| `aos-init`     | During initialisation | On `destroy()`               |
| `aos-animate`  | On viewport enter     | On viewport exit (if `mirror`), or on `destroy()` |

CSS animations should target these classes. A typical pattern:

```css
[data-aos] {
    opacity: 0;
    transition-property: opacity, transform;
    transition-duration: var(--aos-duration, 1000ms);
}
[data-aos].aos-animate {
    opacity: 1;
}
```

The `data-aos-duration`, `data-aos-easing`, and `data-aos-delay` attributes are intended to be consumed by CSS (via attribute selectors or custom properties) to control per-element animation timing.

### Cleanup (`destroy`)

The `destroy()` function:
1. Calls `.disconnect()` on every `IntersectionObserver`.
2. Removes `aos-init` and `aos-animate` from every managed element.
3. Removes only the attributes that Aos added (tracked via `addedAttributes` Map) — attributes that were already on the element before init are preserved.
4. Clears internal arrays and maps.

After `destroy()`, calling `init()` again will re-scan the DOM and set up fresh observers.

## File details

### `src/types.ts`

Exports the `Config` interface. All fields are optional. JSDoc comments on each field serve as the public documentation.

### `src/lib/init.ts`

The core module. Exports a single default function that takes `Config` and returns `{ destroy: () => void }`.

Internal state (not exposed):
- `observers: IntersectionObserver[]` — all created observers, for disconnecting on destroy.
- `managedElements: Element[]` — all `[data-aos]` elements found during init, for cleanup.
- `addedAttributes: Map<Element, string[]>` — tracks which attributes Aos added to each element so destroy only removes those.

### `src/exports.ts`

The package entry point. Should re-export the init function (and any future utilities) for consumers.

## How to extend

### Adding a new config option

1. Add the field to the `Config` interface in `src/types.ts` with a JSDoc comment and `@default` tag.
2. Add the default value to the destructuring in `src/lib/init.ts`.
3. Use the value in the appropriate place in the init logic.
4. Update the README config table.

### Adding a new data attribute

If you want to support a new per-element attribute (e.g. `data-aos-offset`):

1. Add it to the `resetAttributes` array in `src/lib/init.ts` so it's cleaned up when Aos is disabled.
2. In the per-element loop, check if the attribute is already set before applying the global default.
3. Track it in `addedAttributes` if you set it, so `destroy()` can remove it.

### Adding new animation types

Aos itself doesn't define animations — it manages classes and attributes. Animations are handled entirely in CSS. To add new animation types, create CSS rules that target `[data-aos="your-animation"].aos-animate`.

### Supporting dynamic content

Currently Aos scans the DOM once at `init()` time. To observe dynamically added elements, you could:

1. Add a `refresh()` method that re-scans the DOM and sets up observers for new elements.
2. Use a `MutationObserver` to watch for new `[data-aos]` elements and automatically observe them.

Either approach should reuse the existing observer setup logic and add new entries to the internal tracking arrays.

## Build and publish

- **Build**: `bunx tsc` (compiles to `dist/`)
- **Publish**: Automated via GitHub Actions on release creation. The workflow runs `bun install`, `bunx tsc`, then `npm publish --provenance --access public`.
- **Package files**: Only `dist/` is included in the published package (configured via `"files"` in `package.json`).
- **Excluded from npm**: `src/`, `tsconfig.json`, `.github/`, `assets/`, lock files (configured via `.npmignore`).

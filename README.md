<div align="center">

<br />
<h1>Aos</h1>

  <h3>Animate on Scroll, reimagined.<br />A modern, zero-dependency AOS replacement with full TypeScript support.</h3>

  <a href="https://github.com/nitlix-hq/Aos">
    <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/nitlix-hq/Aos?style=social">
  </a>

  <a href="https://www.npmjs.com/package/@nitlix-hq/aos">
    <img alt="npm version" src="https://img.shields.io/npm/v/@nitlix-hq/aos.svg">
  </a>
  <a href="https://www.npmjs.com/package/@nitlix-hq/aos">
    <img alt="weekly downloads" src="https://img.shields.io/npm/dm/@nitlix-hq/aos.svg">
  </a>
</div>

<br />

## Intro

Aos is a lightweight, TypeScript-first scroll animation library powered by `IntersectionObserver`. It's a drop-in replacement for the original [AOS](https://github.com/michalsnik/aos) library — actively maintained, with more features and zero dependencies.

If you've used AOS before, you'll feel right at home. If you haven't, here's what you get:

- **Zero dependencies** — uses only the DOM and `IntersectionObserver`
- **Full TypeScript support** — fully typed config, callbacks, and return values
- **Anchor support** — trigger animations based on a different element's visibility
- **Mirror mode** — reverse animations when elements leave the viewport
- **Per-element overrides** — set `data-aos-duration`, `data-aos-easing`, and `data-aos-delay` on individual elements
- **Mobile control** — disable animations on mobile devices or below a minimum window width
- **Custom disable logic** — pass your own function to decide whether to initialise
- **Clean teardown** — `destroy()` disconnects all observers and removes all added classes/attributes

## Table of contents

- [Quickstart](#quickstart)
- [Configuration](#configuration)
- [HTML attributes](#html-attributes)
- [Anchors](#anchors)
- [Callbacks](#callbacks)
- [Disabling animations](#disabling-animations)
- [Cleanup](#cleanup)
- [Framework examples](#framework-examples)
- [API reference](#api-reference)
- [Contributor docs](#contributor-docs)
- [License](#license)

## Quickstart

Install:

```sh
bun add @nitlix-hq/aos
```

Other package managers:

```sh
pnpm add @nitlix-hq/aos
npm i @nitlix-hq/aos
```

### 1) Add `data-aos` attributes to your HTML

Apply the `data-aos` attribute with the name of the animation you want:

```html
<div data-aos="fade-up">I animate when scrolled into view</div>
<div data-aos="fade-left" data-aos-duration="500">I'm faster</div>
```

### 2) Include AOS CSS

You'll need to include the AOS stylesheet for the built-in animation classes. You can use the original AOS CSS or write your own — Aos toggles the `aos-init` and `aos-animate` classes, so any CSS that targets those will work.

### 3) Initialise Aos

```ts
import init from "@nitlix-hq/aos";

const aos = init({
    duration: 800,
    easing: "ease-in-out",
    mirror: false,
});
```

That's it. Every element with `data-aos` is now observed and will animate when it enters the viewport.

### 4) Clean up when done

```ts
aos.destroy();
```

## Configuration

Pass a config object to `init()`. All fields are optional:

| Option            | Type                                                                                               | Default         | Description                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------- |
| `duration`        | `number`                                                                                           | `1000`          | Animation duration in milliseconds                                                    |
| `easing`          | `string`                                                                                           | `"ease-in-out"` | CSS easing function                                                                   |
| `delay`           | `number`                                                                                           | `0`             | Delay before the animation starts (ms)                                                |
| `mirror`          | `boolean`                                                                                          | `false`         | Reverse animations when elements scroll out of view                                   |
| `offsetEnter`     | `number`                                                                                           | `0`             | Offset (px) from the top of the viewport for triggering enter                         |
| `offsetExit`      | `number`                                                                                           | `0`             | Offset (px) from the bottom of the viewport for triggering exit                       |
| `mobile`          | `boolean`                                                                                          | `false`         | Disable animations on mobile devices (ignored if `disableInitFunc` is set)            |
| `minWindowWidth`  | `number`                                                                                           | `0`             | Minimum window width for animations to be enabled (ignored if `disableInitFunc` is set) |
| `callback`        | `(element, status, observer, entry) => void`                                                       | —               | Called when an element enters or exits the viewport                                   |
| `disableInitFunc` | `() => boolean`                                                                                    | —               | Custom function to determine whether Aos should be disabled                           |

## HTML attributes

These attributes can be set on individual elements to override global config:

| Attribute            | Description                             |
| -------------------- | --------------------------------------- |
| `data-aos`           | The animation name (required)           |
| `data-aos-duration`  | Override animation duration (ms)        |
| `data-aos-easing`    | Override CSS easing function            |
| `data-aos-delay`     | Override animation delay (ms)           |
| `data-aos-anchor`    | CSS selector of an anchor element       |

If a per-element attribute is already set, Aos won't overwrite it with the global default.

## Anchors

By default, Aos observes the animated element itself. With `data-aos-anchor`, you can trigger an animation based on a *different* element entering the viewport:

```html
<div id="trigger-point">Scroll past me...</div>
<div data-aos="fade-up" data-aos-anchor="#trigger-point">
    I animate when #trigger-point is visible
</div>
```

If the anchor selector is invalid or not found, Aos falls back to observing the element itself.

## Callbacks

The `callback` option fires every time an observed element enters or exits the viewport:

```ts
init({
    callback: (element, status, observer, entry) => {
        console.log(element, status); // "enter" or "exit"
    },
});
```

Exit callbacks only fire when `mirror` is `true`.

## Disabling animations

### Mobile detection

```ts
init({ mobile: false }); // disables on mobile user agents
```

### Minimum window width

```ts
init({ minWindowWidth: 768 }); // disables below 768px
```

### Custom logic

```ts
init({
    disableInitFunc: () => {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
});
```

When disabled, Aos strips all `data-aos` related attributes from elements so they render in their final state without animation.

## Cleanup

`init()` returns an object with a `destroy()` method. Calling it:

1. Disconnects all `IntersectionObserver` instances
2. Removes `aos-init` and `aos-animate` classes from all managed elements
3. Removes any attributes that Aos added (preserves attributes that were already present)

```ts
const aos = init();

// Later (e.g. on route change in an SPA):
aos.destroy();
```

## Framework examples

### React

```tsx
import { useEffect } from "react";
import init from "@nitlix-hq/aos";

function App() {
    useEffect(() => {
        const aos = init({ duration: 800, mirror: true });
        return () => aos.destroy();
    }, []);

    return <div data-aos="fade-up">Hello</div>;
}
```

### Svelte

```svelte
<script>
    import { onMount, onDestroy } from "svelte";
    import init from "@nitlix-hq/aos";

    let aos;
    onMount(() => {
        aos = init({ duration: 800 });
    });
    onDestroy(() => aos?.destroy());
</script>

<div data-aos="fade-up">Hello</div>
```

### Vanilla JS

```html
<script type="module">
    import init from "@nitlix-hq/aos";
    init({ duration: 1000, easing: "ease-out" });
</script>

<div data-aos="fade-up">Hello</div>
```

## API reference

### `init(config?)`

Initialises Aos. Scans the DOM for `[data-aos]` elements, sets up `IntersectionObserver` instances, and applies default attributes.

**Parameters:**

| Name     | Type     | Description              |
| -------- | -------- | ------------------------ |
| `config` | `Config` | Optional config object   |

**Returns:** `{ destroy: () => void }`

### `Config`

```ts
interface Config {
    duration?: number;
    easing?: string;
    callback?: (
        element: Element,
        status: "enter" | "exit",
        observer: IntersectionObserver,
        entry: IntersectionObserverEntry,
    ) => void;
    mirror?: boolean;
    disableInitFunc?: () => boolean;
    delay?: number;
    offsetEnter?: number;
    offsetExit?: number;
    mobile?: boolean;
    minWindowWidth?: number;
}
```

## Contributor docs

- **Implementation & extension guide**: [`FOR_AGENTS.md`](FOR_AGENTS.md)

## License

MIT

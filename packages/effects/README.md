# @react-cards-opening/effects

64 effects for React, made to be stacked: particles on a canvas (sparks, confetti, embers, flames), light (rays, flares,
lightning, a sigil), shockwaves, and effects that act on the whole stage (shake, glitch, impact frames). Each is one
name. GSAP inside, one stylesheet, no CSS framework needed.

Part of [react-cards-opening](https://github.com/BetterTyped/react-cards-opening), card opening for React. A free tool
from [Hype Stack](https://www.hype-stack.dev/?utm_source=react-cards-opening&utm_medium=referral&utm_campaign=npm). It
works on its own: nothing here knows what a card is.

```bash
pnpm add @react-cards-opening/effects gsap
```

```tsx
import { EffectLayer, type EffectLayerHandle } from "@react-cards-opening/effects";
import "@react-cards-opening/effects/styles.css";

const layer = useRef<EffectLayerHandle>(null);

<div style={{ position: "relative" }}>
  <EffectLayer handle={layer} />
  <button onClick={(event) => layer.current?.play(["shockwave", "confetti"], { at: event.currentTarget })}>
    Claim
  </button>
</div>;
```

- [Every effect, on a button](https://bettertyped.github.io/react-cards-opening/docs/effects/library/)
- [EffectLayer and playEffects](https://bettertyped.github.io/react-cards-opening/docs/components/effect-layer/)

`@react-cards-opening/ui` brings this package with it and carries its stylesheet, so a page that uses the card
components has nothing to add. All the packages are released together under one version number.

## License

MIT

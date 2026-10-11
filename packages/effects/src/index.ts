// oxlint-disable-next-line import/no-unassigned-import -- the stylesheet is built next to the bundle as styles.css
import "./styles.css";

export { EffectLayer, type EffectLayerHandle, type EffectLayerProps } from "./effect-layer";
export {
  clearEffects,
  EFFECT_KINDS,
  EFFECT_LIST,
  EFFECTS,
  isEffectName,
  playEffects,
  type EffectInput,
  type EffectName,
  type PlayOptions,
} from "./effects";
export type { Particle, ParticleShape } from "./particles";
export { prefersReducedMotion } from "./reduced-motion";
export {
  corners,
  drawing,
  emit,
  figure,
  onEdge,
  part,
  piece,
  shade,
  spawn,
  tint,
  type Effect,
  type EffectKind,
  type EffectStage,
  type Spawn,
} from "./stage";

// oxlint-disable-next-line import/no-unassigned-import -- the stylesheet is built next to the bundle as styles.css
import "./styles.css";

export { Card, CardBackContent, CardContent, type CardProps } from "./card";
export { CardCase, type CardCaseProps } from "./card-case";
export { CardHunt, type CardHuntProps } from "./card-hunt";
export { CardOpening, type CardOpeningProps } from "./card-opening";
export { CardPack, type CardPackProps } from "./card-pack";
export { CardSpin, type CardSpinProps } from "./card-spin";
export { CardWheel, type CardWheelProps } from "./card-wheel";
export type {
  CardCaseClassNames,
  CardClassNames,
  CardContentClassNames,
  CardHuntClassNames,
  CardOpeningClassNames,
  CardPackClassNames,
  CardSpinClassNames,
  CardWheelClassNames,
  LootCaseClassNames,
  PanelClassNames,
  PrizeWheelClassNames,
  ScanGridClassNames,
  SpinReelClassNames,
} from "./class-names";
export { EffectLayer, type EffectLayerHandle, type EffectLayerProps } from "./effect-layer";
export {
  clearEffects,
  EFFECT_KINDS,
  EFFECT_LIST,
  EFFECT_SETS,
  EFFECTS,
  effectsFor,
  isEffectName,
  playEffects,
  playSteps,
  SIGNATURE_EFFECTS,
  type EffectCue,
  type EffectInput,
  type EffectMoment,
  type EffectName,
  type EffectPlan,
  type EffectSetId,
  type EffectStep,
  type PlayOptions,
} from "./effects";
export type { Particle, ParticleShape } from "./fx-particles";
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
} from "./fx-stage";
export { GLYPHS, type GlyphId, type PixelArt } from "./glyphs";
export {
  CARD_CASE_LABELS,
  CARD_HUNT_LABELS,
  CARD_OPENING_LABELS,
  CARD_PACK_LABELS,
  CARD_SPIN_LABELS,
  CARD_WHEEL_LABELS,
  type CardCaseLabels,
  type CardHuntLabels,
  type CardOpeningLabels,
  type CardPackLabels,
  type CardSpinLabels,
  type CardWheelLabels,
  type HuntState,
  type OpenerState,
  type PackState,
} from "./labels";
export { LootCase, type LootCaseHandle, type LootCaseProps } from "./loot-case";
export { PixelGlyph, type PixelGlyphProps } from "./pixel-glyph";
export { PrizeWheel, type PrizeWheelHandle, type PrizeWheelProps } from "./prize-wheel";
export { ScanGrid, type ScanGridHandle, type ScanGridProps, type ScanMarker } from "./scan-grid";
export { SpinReel, type SpinReelHandle, type SpinReelProps } from "./spin-reel";
export {
  customTheme,
  DEFAULT_THEME,
  DEFAULT_THEME_ID,
  isThemeId,
  mixColors,
  RARITY_ON_DARK,
  RARITY_ON_LIGHT,
  rarityColor,
  THEME_LIST,
  themeOf,
  themeStyle,
  type CardTheme,
  type RarityColors,
  type ThemeId,
  type ThemeMode,
} from "./theme";
export type { CardFaceInfo, CardLaunch, CardShow, GlyphCard } from "./types";

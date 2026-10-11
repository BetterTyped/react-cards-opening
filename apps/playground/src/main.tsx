// oxlint-disable-next-line import/no-unassigned-import -- the page's font
import "@fontsource-variable/inter";
import { gsap } from "gsap";
import { StrictMode, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { cards, describeDay, everyCard, found, hero, lead, levels, theme } from "./sample";
// oxlint-disable-next-line import/no-unassigned-import -- the page around the piece
import "./page.css";
import {
  Card,
  CardCase,
  CardHunt,
  CardPack,
  CardSpin,
  CardWheel,
  EFFECT_SETS,
  EffectLayer,
  type EffectLayerHandle,
  type EffectName,
  type EffectPlan,
  isEffectName,
  rarityColor,
} from "@react-cards-opening/ui";

const params = new URLSearchParams(window.location.search);
const view = params.get("view") ?? "hunt";
const set = params.get("effects");
// ?effects=none is the card's own show and nothing more; a set's name is that set; nothing is the signature shows.
let plan: EffectPlan | false | undefined;
if (set === "none") plan = false;
else if (set && set in EFFECT_SETS) plan = EFFECT_SETS[set as keyof typeof EFFECT_SETS];

/*
 * One piece on a bare page, set up from the address bar (see sample.ts): ?view=hunt (the default), spin, case,
 * pack or fx, and ?effects=storm for a set of effects (none for the card's own show alone). It is where the library is worked on, and what the
 * picture test in e2e/ plays frame by frame.
 */
function Page() {
  const [opened, setOpened] = useState<readonly string[]>(found);
  const onOpen = (id: string) => setOpened((now) => (now.includes(id) ? now : [...now, id]));
  if (view === "fx") return <Effects />;
  return (
    <div className="page" data-hero={hero ? "" : undefined}>
      {view === "spin" ? <CardSpin cards={cards} opened={opened} onOpen={onOpen} theme={theme} effects={plan} /> : null}
      {view === "wheel" ? (
        <CardWheel cards={cards} pool={everyCard} opened={opened} onOpen={onOpen} theme={theme} effects={plan} />
      ) : null}
      {view === "case" ? <CardCase cards={cards} opened={opened} onOpen={onOpen} theme={theme} effects={plan} /> : null}
      {view === "pack" ? <CardPack cards={cards} opened={opened} onOpen={onOpen} theme={theme} effects={plan} /> : null}
      {view === "hunt" ? (
        <CardHunt
          cards={cards}
          opened={opened}
          onOpen={onOpen}
          levels={levels}
          lead={lead}
          theme={theme}
          hero={hero}
          describeSpot={describeDay}
          effects={plan}
        />
      ) : null}
    </div>
  );
}

/** One card on an empty stage and a button that plays ?fx=sparks,shockwave on it, in ?tier=legendary's colour. */
function Effects() {
  const layer = useRef<EffectLayerHandle>(null);
  const card = useRef<HTMLDivElement>(null);
  const shown = everyCard.find((one) => one.rarity === (params.get("tier") ?? "legendary")) ?? cards[0];
  const names = (params.get("fx") ?? "sparks").split(",").filter((name): name is EffectName => isEffectName(name));
  if (!shown) return null;
  return (
    <div className="fx-stage" style={{ background: theme.bg }}>
      <div className="fx-room">
        <EffectLayer handle={layer} theme={theme} />
        <div ref={card} className="fx-card">
          <Card card={shown} theme={theme} width={Number(params.get("width") ?? 220)} />
        </div>
      </div>
      <button
        type="button"
        className="fx-play"
        onClick={() =>
          layer.current?.play(names, {
            at: card.current,
            tone: rarityColor(theme, shown.rarity),
            accent: theme.levels[4],
          })
        }
      >
        Play
      </button>
    </div>
  );
}

// For the tests: the animation clock, to read where it stands.
(window as unknown as { gsap: typeof gsap }).gsap = gsap;

const root = document.querySelector("#root");
if (root) {
  // ?strict runs every effect twice, the way React does in development: a check that nothing depends on running once.
  const strict = new URLSearchParams(window.location.search).has("strict");
  createRoot(root).render(
    strict ? (
      <StrictMode>
        <Page />
      </StrictMode>
    ) : (
      <Page />
    ),
  );
}

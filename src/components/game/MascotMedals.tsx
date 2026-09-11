import {
  MASCOT_IDS,
  MASCOT_NAMES,
  mascotMedalTiers,
  type MascotProgress,
} from "@/lib/game/mascot-progress";

const TIER_NAMES = {
  bronze: "bronce",
  silver: "plata",
  gold: "oro",
} as const;

export function MascotMedals({ progress }: { progress: MascotProgress }) {
  const medals = MASCOT_IDS.flatMap((id) => mascotMedalTiers(progress.greetings[id]).map((tier) => ({ id, tier })));
  if (medals.length === 0 && !progress.pentonuiMedal) return null;

  return (
    <div className="title-mascot-medals" aria-label="Medallas de amistad con las mascotas">
      {medals.map(({ id, tier }) => (
        <span
          key={`${id}-${tier}`}
          className={`title-mascot-medal mascot-medal-${id} mascot-medal-${tier}`}
          title={`${MASCOT_NAMES[id]} · Medalla de ${TIER_NAMES[tier]}`}
          aria-label={`${MASCOT_NAMES[id]}: medalla de ${TIER_NAMES[tier]}`}
        >
          <span aria-hidden />
        </span>
      ))}
      {progress.pentonuiMedal ? (
        <span className="title-mascot-medal mascot-medal-pentonui" title="Medalla Pentonúi · Colección completa" aria-label="Medalla Pentonúi: colección completa">
          <img src="/brand/pentonui-games-icon.png" alt="" />
        </span>
      ) : null}
    </div>
  );
}

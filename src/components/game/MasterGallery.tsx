import {
  Check,
  CloudLightning,
  Crown,
  FerrisWheel,
  FlipHorizontal2,
  Lightbulb,
  MoonStar,
  Palette,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import type { Settings } from "@/lib/game/persist";
import type { GameChallenge } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEMES: { id: GameChallenge; name: string; note: string; icon: typeof Sun }[] = [
  { id: "classic", name: "Feria de día", note: "La portada original", icon: Sun },
  { id: "night", name: "Guardia nocturna", note: "Azul y luz de luna", icon: MoonStar },
  { id: "festival", name: "Festival", note: "Farolillos y color", icon: Lightbulb },
  { id: "mirror", name: "Espejo", note: "Plata sobre el lago", icon: FlipHorizontal2 },
  { id: "storm", name: "Tormenta", note: "Lluvia y neón", icon: CloudLightning },
  { id: "impossible", name: "Las 00:13", note: "El final verdadero", icon: Crown },
];

const BACKS: { id: Settings["cardBack"]; name: string; note: string }[] = [
  { id: "classic", name: "Cartel de feria", note: "Reverso original" },
  { id: "mechanical", name: "Flor mecánica", note: "Señal Pentonúi" },
  { id: "festival", name: "Fuegos de feria", note: "Festival de las Luces" },
  { id: "storm", name: "Nube dorada", note: "Día de Tormenta" },
  { id: "impossible", name: "Guardián 00:13", note: "Final verdadero" },
  { id: "dual", name: "Reverso DUAL", note: "Todo el parque completado" },
];

export function MasterGallery({
  theme,
  cardBack,
  onTheme,
  onCardBack,
  onClose,
}: {
  theme: GameChallenge;
  cardBack: Settings["cardBack"];
  onTheme: (theme: GameChallenge) => void;
  onCardBack: (cardBack: Settings["cardBack"]) => void;
  onClose: () => void;
}) {
  return (
    <div className="master-gallery-layer" role="dialog" aria-modal="true" aria-labelledby="master-gallery-title">
      <button type="button" className="master-gallery-backdrop" onClick={onClose} aria-label="Cerrar Galería Maestro" />
      <section className="master-gallery-card">
        <header>
          <span className="master-gallery-seal"><Palette /></span>
          <span><small>Recompensa del final verdadero</small><h2 id="master-gallery-title">Galería Maestro</h2></span>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Cerrar"><X /></Button>
        </header>
        <p>Haz que Poker Park recuerde vuestra aventura. La elección queda guardada en este dispositivo.</p>

        <h3><Sparkles /> Ambiente y música de portada</h3>
        <div className="gallery-theme-grid">
          {THEMES.map(({ id, name, note, icon: Icon }) => (
            <button key={id} type="button" className={cn("gallery-theme", theme === id && "is-selected")} onClick={() => onTheme(id)}>
              <Icon /><span><strong>{name}</strong><small>{note}</small></span>{theme === id ? <Check /> : null}
            </button>
          ))}
        </div>

        <h3><FerrisWheel /> Reverso de las cartas</h3>
        <div className="gallery-back-grid">
          {BACKS.map(({ id, name, note }) => (
            <button key={id} type="button" className={cn("gallery-back-option", `gallery-back-${id}`, cardBack === id && "is-selected")} onClick={() => onCardBack(id)}>
              <span className="gallery-card-preview"><i /></span>
              <span><strong>{name}</strong><small>{note}</small></span>
              {cardBack === id ? <Check /> : null}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

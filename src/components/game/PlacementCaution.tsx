import * as Dialog from "@radix-ui/react-dialog";
import { TriangleAlert } from "lucide-react";
import { ATTRACTION_DEFS } from "@/lib/game/attractions";
import { exchangeLimit } from "@/lib/game/engine";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";

export function PlacementCaution() {
  const caution = useGameStore(s => s.placementCaution);
  const game = useGameStore(s => s.game);
  const selected = useGameStore(s => s.selectedCardId);
  const dismiss = useGameStore(s => s.dismissPlacementCaution);
  const confirm = useGameStore(s => s.confirmPlacementCaution);
  if (!caution || caution.game !== game || selected !== caution.cardId || game.ended) return null;
  const changes = exchangeLimit(game) - game.exchangesUsed;
  return <Dialog.Root open onOpenChange={open => { if (!open) dismiss(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="game-help-backdrop" />
      <Dialog.Content className="game-help-dialog placement-caution">
        <TriangleAlert className="game-help-icon" aria-hidden />
        <Dialog.Title>Antes de colocar…</Dialog.Title>
        <Dialog.Description>Esta jugada compromete completar el parque. Con las cartas tal como quedarían colocadas:</Dialog.Description>
        <ul>{caution.warning.groups.map((group, i) => <li key={i}>
          <strong>{group.attractions.map(id => ATTRACTION_DEFS[id].name).join(" y ")}</strong>
          <span>{group.missing === 1 ? "Faltaría al menos una carta adecuada para completar el recorrido." : `Faltarían al menos ${group.missing} cartas adecuadas para completar estos recorridos.`}</span>
        </li>)}</ul>
        <p>{changes > 0
          ? `Te quedan ${changes} ${changes === 1 ? "intercambio" : "intercambios"}. Podrías recuperar cartas con un cambio legal en una atracción incompleta; las completas quedan cerradas. No siempre habrá un cambio que lo resuelva.`
          : "Ya no quedan intercambios para recuperar cartas colocadas."}</p>
        <p>La decisión es tuya: puedes continuar con esta colocación.</p>
        <div className="game-help-actions">
          <Button onClick={dismiss}>Reconsiderar</Button>
          <Button variant="secondary" onClick={confirm}>Colocar igualmente</Button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

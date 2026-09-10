import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BriefcaseBusiness, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayingCard } from "./PlayingCard";
import { hasJackBox, jokerAvailable, jokerOptions } from "@/lib/game/night-tools";
import { legalExchanges, legalPlacements } from "@/lib/game/engine";
import { rankLabel } from "@/lib/game/deck";
import { useGameStore } from "@/store/game-store";
import type { GameState, Suit, Rank } from "@/lib/game/types";

export function NightJackBox({ game, locked }: { game: GameState; locked: boolean }) {
  const [open, setOpen] = useState(false);
  const select = useGameStore(s => s.selectCard);
  const selected = useGameStore(s => s.selectedCardId);
  const exchangeMode = useGameStore(s => s.exchangeMode);
  if (!hasJackBox(game)) return null;
  const box = game.night?.jackBox ?? [];
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger className="night-jack-trigger" disabled={locked}>
      <BriefcaseBusiness aria-hidden /><strong>Caseta de guardia</strong><span>J · {box.length}</span>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="game-help-backdrop" />
      <Dialog.Content className="game-help-dialog">
        <Dialog.Close className="game-help-close" aria-label="Cerrar caseta"><X /></Dialog.Close>
        <Dialog.Title>Caseta de guardia</Dialog.Title>
        <Dialog.Description>Solo Jotas. Al llegar a tu mano, descansan aquí y robas otra carta si queda mazo. Puedes colocarlas en las Sillas cuando la torre esté lista, o seleccionar una y pulsar Cambiar para recibir una carta de la Entrada. El cambio consume una maniobra; después colocas la carta recibida.</Dialog.Description>
        <div className="night-jack-cards">{box.map(card => <PlayingCard key={card.id} card={card} size="sm"
          legal={(exchangeMode ? legalExchanges(game, card.id) : legalPlacements(game, card.id)).length > 0} selected={selected === card.id}
          onClick={locked ? undefined : () => { select(card.id); setOpen(false); }} />)}</div>
        {!box.length ? <p>Las Jotas que robes aparecerán aquí.</p> : null}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export function NightJokerPicker({ game, onClose }: { game: GameState; onClose: () => void }) {
  const [suit, setSuit] = useState<Suit>("clubs");
  const [rank, setRank] = useState<Rank>(1);
  const select = useGameStore(s => s.selectJoker);
  if (!hasJackBox(game) || game.difficulty !== "easy") return null;
  const candidate = jokerOptions(game).find(card => card.rank === rank && card.suit === suit);
  const ready = Boolean(candidate && legalPlacements(game, candidate.id).length && !game.swappedCardId && !game.pendingAdvance);
  return <section className="night-joker-picker">
    <h3><Sparkles aria-hidden /> Comodín de guardia <small>{jokerAvailable(game) ? "1 uso" : "Utilizado"}</small></h3>
    {jokerAvailable(game) ? <>
      <p>Elige su valor y palo. Al colocarlo quedará fijado. No consume intercambio y respeta el orden de cada atracción.</p>
      <div className="night-joker-fields">
        <label>Valor<select value={rank} onChange={e => setRank(Number(e.target.value) as Rank)}>{Array.from({ length: 13 }, (_, i) => i + 1).map(r => <option key={r} value={r}>{rankLabel(r as Rank)}</option>)}</select></label>
        <label>Palo<select value={suit} onChange={e => setSuit(e.target.value as Suit)}>
          <option value="clubs">Tréboles ♣</option><option value="diamonds">Diamantes ♦</option><option value="hearts">Corazones ♥</option><option value="spades">Picas ♠</option>
        </select></label>
      </div>
      <Button disabled={!ready} onClick={() => { if (candidate) { select(candidate); onClose(); } }}>Preparar comodín</Button>
      {!ready ? <small>{game.swappedCardId ? "Primero coloca la carta recibida en el intercambio." : "Ese valor y palo no encajan ahora. Prueba otra combinación."}</small> : null}
    </> : <p>Tu comodín ya tiene un valor y un palo fijados en esta partida.</p>}
  </section>;
}

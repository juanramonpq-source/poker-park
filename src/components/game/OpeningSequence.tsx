import { useEffect, useRef, useState } from "react";
import { playMapFold, playMapUnfold, playStart } from "@/lib/game/audio";
import type { OpeningStage } from "./useOpeningSequence";

export function OpeningSequence({ stage, setStage, wake, skip, reduced }: {
  stage: OpeningStage;
  setStage: (stage: OpeningStage) => void;
  wake: () => void;
  skip: () => void;
  reduced: boolean;
}) {
  const action = useRef<HTMLButtonElement>(null);
  const [frame, setFrame] = useState(0);
  const [assetFailed, setAssetFailed] = useState(false);
  const [assetReady, setAssetReady] = useState(false);
  useEffect(() => {
    const sprite = new Image();
    sprite.onload = () => setAssetReady(true);
    sprite.onerror = () => setAssetFailed(true);
    sprite.src = "/images/opening-ticket-sprites.png";
    if (sprite.complete && sprite.naturalWidth > 0) setAssetReady(true);
    return () => { sprite.onload = null; sprite.onerror = null; };
  }, []);
  useEffect(() => {
    if (stage === "tearing" && !reduced) {
      const timers = [1, 2, 3].map((value, index) => window.setTimeout(() => setFrame(value), 110 * (index + 1)));
      return () => timers.forEach(clearTimeout);
    }
    setFrame(stage === "validated" || stage === "flying" ? 3 : 0);
  }, [stage, reduced]);
  useEffect(() => {
    if (["studio", "ticket", "validated"].includes(stage)) action.current?.focus({ preventScroll: true });
  }, [stage, assetReady]);

  const black = ["loading", "studio", "studio-turn", "ticket", "tearing", "validated", "flying"].includes(stage);
  if (!black) return stage === "ready" ? null : <button type="button" className="opening-skip" onClick={skip}>Omitir apertura</button>;
  return <div className="opening-cinema" data-opening-stage={stage} role="dialog" aria-modal="true" aria-label="Bienvenida a Poker Park">
    <svg className="opening-studio-color-filters" width="0" height="0" aria-hidden>
      <defs>
        <filter id="studio-triangle-red" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 .15 .85 0 0  0 .25 0 0 0  .3 0 0 0 0  0 0 0 1 0" />
        </filter>
        <filter id="studio-triangle-blue" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 .65 0 0  .45 .5 0 0 0  1 0 0 0 0  0 0 0 1 0" />
        </filter>
      </defs>
    </svg>
    <img className="opening-asset-preload" src="/images/opening-ticket-sprites.png" alt="" aria-hidden onLoad={() => setAssetReady(true)} onError={() => setAssetFailed(true)} />
    {stage === "studio" || stage === "studio-turn" ? <button ref={action} type="button" className="opening-studio" data-turning={stage === "studio-turn" || undefined} disabled={stage === "studio-turn"}
      aria-label="Pentonúi Games · Toca para comenzar y activar el sonido"
      onClick={() => { if (stage !== "studio") return; wake(); setStage(reduced ? "ticket" : "studio-turn"); }}>
      <span className="opening-studio-brand" aria-hidden>
        <span className="opening-studio-flower">
          <span className="opening-studio-face opening-studio-face-front" />
          <span className="opening-studio-face opening-studio-face-back">
            <span className="opening-studio-triangle opening-studio-triangle-red" />
            <span className="opening-studio-triangle opening-studio-triangle-blue" />
          </span>
        </span>
        <span className="opening-studio-wordmark" />
      </span>
      <strong>Pentonúi Games</strong>
      <span className="opening-studio-hint">Toca para comenzar · activa el sonido</span>
    </button> : stage !== "loading" ? <div className="opening-ticket-scene">
      <button ref={action} type="button" className="opening-ticket" data-flying={stage === "flying" || undefined} disabled={stage === "tearing" || stage === "flying" || !assetReady || assetFailed}
        aria-label={stage === "validated" ? "¡Ya puedes entrar! Soltar la entrada" : "Rasgar y validar la entrada de Poker Park"}
        onClick={() => { wake(); if (stage === "ticket") { playMapFold(); setStage("tearing"); } else if (stage === "validated") { playMapUnfold(); playStart(); setStage("flying"); } }}>
        <span className="opening-ticket-sprite" data-frame={frame} aria-hidden />
      </button>
      <div className="opening-ticket-caption" aria-live="polite">
        {assetFailed ? <p>No se ha podido cargar la entrada. Puedes continuar con «Omitir apertura».</p> : !assetReady ? <p>Preparando tu entrada…</p> : stage === "validated" ? <><strong>¡Ya puedes entrar!</strong><p>Entrada validada · tócala para dejarla volar</p></> : stage === "ticket" ? <><strong>Tu entrada a Poker Park</strong><p>Tócala para validarla</p></> : stage === "tearing" ? <p>Validando tu entrada…</p> : null}
      </div>
    </div> : null}
    {stage !== "loading" ? <button type="button" className="opening-skip" onClick={skip}>Omitir apertura</button> : null}
  </div>;
}

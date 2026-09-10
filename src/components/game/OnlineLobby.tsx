import {
  Check,
  Copy,
  Globe2,
  Link2,
  LoaderCircle,
  Shield,
  Signal,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DifficultySelector } from "@/components/game/DifficultySelector";
import { CHALLENGE_NAMES } from "@/lib/game/challenges";
import { normalizeCode, useOnlineGame } from "@/lib/multiplayer/online-game";
import type { GameChallenge, GameDifficulty } from "@/lib/game/types";
import { masterTrialsComplete, type Secrets } from "@/lib/game/persist";

const CHALLENGES: GameChallenge[] = [
  "classic",
  "night",
  "festival",
  "mirror",
  "storm",
  "impossible",
];

function challengeAvailable(challenge: GameChallenge, secrets: Secrets) {
  if (challenge === "classic") return true;
  if (challenge === "night") return secrets.perfect;
  if (challenge === "impossible") return masterTrialsComplete(secrets) || secrets.impossiblePerfect;
  return secrets.nightPerfect;
}

export function OnlineLobby({ secrets, onClose }: { secrets: Secrets; onClose: () => void }) {
  const online = useOnlineGame();
  const invitedCode = useMemo(() => {
    if (typeof window === "undefined") return "";
    return normalizeCode(new URL(window.location.href).searchParams.get("sala") ?? "");
  }, []);
  const [view, setView] = useState<"choose" | "create" | "join">(invitedCode ? "join" : "choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState(invitedCode);
  const [challenge, setChallenge] = useState<GameChallenge>("classic");
  const [difficulty, setDifficulty] = useState<GameDifficulty>("standard");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (online.role === "host") setView("create");
    if (online.role === "guest") setView("join");
  }, [online.role]);

  const close = () => {
    if (online.status !== "idle") online.leaveRoom();
    onClose();
  };

  const copyInvite = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("sala", online.roomCode);
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const connected = online.status === "connected";
  const busy = online.status === "joining" || online.status === "waiting" || connected;

  return (
    <div className="online-overlay" role="dialog" aria-modal="true" aria-labelledby="online-title">
      <button
        className="tutorial-backdrop"
        type="button"
        aria-label="Cerrar modo online"
        onClick={close}
      />
      <section className="online-card">
        <header className="online-heading">
          <span className="online-emblem">
            <Globe2 aria-hidden />
          </span>
          <div>
            <p className="tutorial-kicker">Beta web · sala privada</p>
            <h2 id="online-title">Jugar online</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={close} aria-label="Cerrar">
            <X />
          </Button>
        </header>

        {view === "choose" ? (
          <div className="online-choice-grid stagger-in">
            <button type="button" onClick={() => setView("create")}>
              <Signal aria-hidden />
              <strong>Crear una sala</strong>
              <small>Preparas la partida y compartes el código.</small>
            </button>
            <button type="button" onClick={() => setView("join")}>
              <Link2 aria-hidden />
              <strong>Unirme con código</strong>
              <small>Entras en la sala que te han enviado.</small>
            </button>
          </div>
        ) : (
          <div className="online-flow">
            {!busy ? (
              <>
                <label className="online-field">
                  <span>Tu nombre</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={24}
                    placeholder={view === "create" ? "Jugador 1" : "Jugador 2"}
                    autoComplete="nickname"
                  />
                </label>
                {view === "join" ? (
                  <label className="online-field">
                    <span>Código de sala</span>
                    <input
                      className="online-code-input"
                      value={code}
                      onChange={(event) => setCode(normalizeCode(event.target.value))}
                      maxLength={6}
                      placeholder="ABC234"
                      autoCapitalize="characters"
                    />
                  </label>
                ) : null}
                <Button
                  size="lg"
                  className="w-full"
                  disabled={view === "join" && code.length !== 6}
                  onClick={() =>
                    view === "create" ? online.createRoom(name) : online.joinRoom(code, name)
                  }
                >
                  {view === "create" ? "Crear sala privada" : "Entrar en la sala"}
                </Button>
                <button className="online-back" type="button" onClick={() => setView("choose")}>
                  Volver
                </button>
              </>
            ) : (
              <>
                <div className="online-room-code">
                  <span>Código de sala</span>
                  <strong>{online.roomCode}</strong>
                  {online.role === "host" ? (
                    <button type="button" onClick={copyInvite}>
                      {copied ? <Check /> : <Copy />}
                      {copied ? "Enlace copiado" : "Copiar invitación"}
                    </button>
                  ) : null}
                </div>
                <div
                  className={`online-connection is-${online.status}`}
                  role="status"
                  aria-live="polite"
                >
                  {connected ? <Signal /> : <LoaderCircle className="online-spinner" />}
                  <span>
                    <strong>
                      {connected
                        ? `${online.peer?.name || "Compañero"} está dentro`
                        : online.status === "failed"
                          ? "No se pudo conectar"
                          : "Esperando al otro jugador"}
                    </strong>
                    <small>
                      {online.error ??
                        (connected ? "La sala ya está lista." : "No cierres esta pantalla.")}
                    </small>
                  </span>
                </div>

                {connected && online.role === "host" ? (
                  <div className="online-setup">
                    <label>
                      <span>Reto</span>
                      <select
                        value={challenge}
                        onChange={(event) => setChallenge(event.target.value as GameChallenge)}
                      >
                        {CHALLENGES.map((item) => (
                          <option
                            key={item}
                            value={item}
                            disabled={!challengeAvailable(item, secrets)}
                          >
                            {CHALLENGE_NAMES[item]}
                            {challengeAvailable(item, secrets) ? "" : " · bloqueado"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <DifficultySelector
                      challenge={challenge}
                      value={difficulty}
                      onChange={setDifficulty}
                      dark
                    />
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => online.startGame(challenge, difficulty)}
                    >
                      Empezar juntos
                    </Button>
                  </div>
                ) : connected ? (
                  <p className="online-wait-start">
                    <UserRound /> El anfitrión está eligiendo el reto y la dificultad.
                  </p>
                ) : null}
              </>
            )}
          </div>
        )}

        <p className="online-privacy">
          <Shield aria-hidden /> La partida viaja directamente entre ambos navegadores. Al
          conectaros, cada dispositivo puede conocer la dirección de red del otro.
        </p>
      </section>
    </div>
  );
}

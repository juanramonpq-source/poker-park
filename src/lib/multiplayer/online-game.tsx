import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { P2PRoom, type PeerInfo } from "@/lib/multiplayer";
import {
  ATTRACTION_IDS,
  type GameChallenge,
  type GameDifficulty,
  type GameState,
} from "@/lib/game/types";
import { useGameStore, type AiMoveFx } from "@/store/game-store";
import { isGameState } from "@/lib/game/state-validation";

type OnlineRole = "host" | "guest";
type OnlineStatus = "idle" | "joining" | "waiting" | "connected" | "failed";

type GamePacket = {
  type: "game";
  id: string;
  game: GameState;
  move: AiMoveFx | null;
};

interface OnlineContextValue {
  status: OnlineStatus;
  role: OnlineRole | null;
  roomCode: string;
  localPlayer: 0 | 1 | null;
  peer: PeerInfo | null;
  error: string | null;
  createRoom: (name: string) => void;
  joinRoom: (code: string, name: string) => void;
  leaveRoom: () => void;
  startGame: (challenge: GameChallenge, difficulty: GameDifficulty) => void;
}

const OnlineContext = createContext<OnlineContextValue | null>(null);
const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length: number) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => ROOM_ALPHABET[value % ROOM_ALPHABET.length]).join("");
}

function randomId() {
  return `${Date.now().toString(36)}_${randomCode(10)}`;
}

function normalizeCode(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function inferMove(previous: GameState | null, next: GameState): AiMoveFx | null {
  if (!previous || previous.mode !== "online") return null;
  for (const attractionId of ATTRACTION_IDS) {
    const before = previous.attractions[attractionId];
    const after = next.attractions[attractionId];
    for (let index = 0; index < after.slots.length; index += 1) {
      const card = after.slots[index];
      if (card && before.slots[index]?.id !== card.id) {
        return {
          n: Date.now(),
          card,
          attractionId,
          index,
          kind: "place",
          player: previous.currentPlayer,
        };
      }
    }
    const visitor = after.visitors.find(
      (card) => !before.visitors.some((old) => old.id === card.id),
    );
    if (visitor)
      return {
        n: Date.now(),
        card: visitor,
        attractionId,
        index: null,
        kind: "visit",
        player: previous.currentPlayer,
      };
  }
  return null;
}

export function OnlineGameProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<OnlineStatus>("idle");
  const [role, setRole] = useState<OnlineRole | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [peer, setPeer] = useState<PeerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<P2PRoom | null>(null);
  const roleRef = useRef<OnlineRole | null>(null);
  const localNameRef = useRef("Jugador");
  const remoteGames = useRef(new WeakSet<GameState>());
  const previousGame = useRef<GameState | null>(null);
  const connectedPeerId = useRef<string | null>(null);
  const receivedPackets = useRef(new Set<string>());

  const leaveRoom = useCallback(() => {
    roomRef.current?.close();
    roomRef.current = null;
    roleRef.current = null;
    setRole(null);
    setRoomCode("");
    setPeer(null);
    connectedPeerId.current = null;
    setError(null);
    setStatus("idle");
    useGameStore.getState().setOnlineLocalPlayer(null);
    useGameStore.getState().setOnlineConnected(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("sala");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const enterRoom = useCallback((nextRole: OnlineRole, rawCode: string, rawName: string) => {
    roomRef.current?.close();
    const code = normalizeCode(rawCode);
    const name = rawName.trim().slice(0, 24) || (nextRole === "host" ? "Anfitrión" : "Invitado");
    const selfId = randomId();
    connectedPeerId.current = null;
    receivedPackets.current.clear();
    roleRef.current = nextRole;
    localNameRef.current = name;
    setRole(nextRole);
    setRoomCode(code);
    setPeer(null);
    setError(null);
    setStatus("joining");
    useGameStore.getState().setOnlineLocalPlayer(nextRole === "host" ? 0 : 1);
    useGameStore.getState().setOnlineConnected(false);
    const url = new URL(window.location.href);
    url.searchParams.set("sala", code);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);

    const room = new P2PRoom({
      room: `pokerpark_${code}`,
      selfId,
      name,
      onConnected: () => {
        if (roomRef.current === room) setStatus("waiting");
      },
      onError: (message) => {
        if (roomRef.current !== room) return;
        setError(message);
        if (message) {
          setStatus("failed");
          useGameStore.getState().setOnlineConnected(false);
        } else {
          const ready = room.peerList().some((other) => other.connectionState === "connected");
          setStatus(ready ? "connected" : "waiting");
          useGameStore.getState().setOnlineConnected(ready);
        }
      },
      onPeersChanged: (peers) => {
        if (roomRef.current !== room) return;
        if (peers.length > 1) {
          setError("La sala ya tiene dos jugadores.");
          setStatus("failed");
          return;
        }
        const other = peers[0] ?? null;
        setPeer(other);
        if (other?.connectionState === "connected") {
          setError(null);
          useGameStore.getState().setOnlineConnected(true);
          setStatus("connected");
          if (roleRef.current === "host" && connectedPeerId.current !== other.id) {
            connectedPeerId.current = other.id;
            window.setTimeout(() => {
              if (roomRef.current !== room) return;
              const game = useGameStore.getState().game;
              if (game?.mode === "online") {
                room.send({ type: "game", id: randomId(), game, move: null } satisfies GamePacket);
              }
            }, 250);
          }
        } else if (!other) {
          useGameStore.getState().setOnlineConnected(false);
          connectedPeerId.current = null;
          setStatus("waiting");
        } else if (other?.connectionState === "failed" || other?.connectionState === "closed") {
          useGameStore.getState().setOnlineConnected(false);
          setError("No hemos podido conectar ambos navegadores. Prueba a crear otra sala.");
          setStatus("failed");
        } else if (other) {
          useGameStore.getState().setOnlineConnected(false);
          setStatus("joining");
        }
      },
      onMessage: (_from, data, channel) => {
        if (roomRef.current !== room) return;
        if (channel !== "reliable" || !data || typeof data !== "object") return;
        const packet = data as Partial<GamePacket>;
        if (packet.type !== "game" || !isGameState(packet.game) || packet.game.mode !== "online") return;
        if (typeof packet.id !== "string" || receivedPackets.current.has(packet.id)) return;
        receivedPackets.current.add(packet.id);
        if (receivedPackets.current.size > 200) receivedPackets.current.delete(receivedPackets.current.values().next().value!);
        remoteGames.current.add(packet.game);
        useGameStore.getState().syncOnlineGame(
          packet.game,
          inferMove(useGameStore.getState().game, packet.game),
        );
      },
    });
    roomRef.current = room;
    void room.join();
  }, []);

  const createRoom = useCallback(
    (name: string) => enterRoom("host", randomCode(6), name),
    [enterRoom],
  );
  const joinRoom = useCallback(
    (code: string, name: string) => enterRoom("guest", code, name),
    [enterRoom],
  );

  const startGame = useCallback(
    (challenge: GameChallenge, difficulty: GameDifficulty) => {
      if (roleRef.current !== "host" || !roomRef.current || status !== "connected") return;
      const otherName = peer?.name || "Invitado";
      useGameStore
        .getState()
        .start("online", challenge, difficulty, [localNameRef.current, otherName]);
    },
    [peer, status],
  );

  useEffect(() => {
    return useGameStore.subscribe((state) => {
      const game = state.game;
      const before = previousGame.current;
      previousGame.current = game;
      if (game === before) return;
      if (!game || game.mode !== "online" || !roomRef.current || remoteGames.current.has(game))
        return;
      const packet: GamePacket = {
        type: "game",
        id: randomId(),
        game,
        move: inferMove(before, game),
      };
      roomRef.current.send(packet);
    });
  }, []);

  useEffect(() => () => roomRef.current?.close(), []);

  useEffect(() => {
    if (role !== "guest" || peer || (status !== "waiting" && status !== "joining")) return;
    const timeout = window.setTimeout(() => {
      setError("No encontramos al anfitrión. Comprueba el código y que ambos usáis la misma dirección del juego con la sala abierta.");
      setStatus("failed");
    }, 25_000);
    return () => window.clearTimeout(timeout);
  }, [role, peer, status]);

  const value = useMemo<OnlineContextValue>(
    () => ({
      status,
      role,
      roomCode,
      localPlayer: role === "host" ? 0 : role === "guest" ? 1 : null,
      peer,
      error,
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
    }),
    [status, role, roomCode, peer, error, createRoom, joinRoom, leaveRoom, startGame],
  );

  return <OnlineContext.Provider value={value}>{children}</OnlineContext.Provider>;
}

export function useOnlineGame() {
  const context = useContext(OnlineContext);
  if (!context) throw new Error("useOnlineGame debe usarse dentro de OnlineGameProvider");
  return context;
}

export { normalizeCode };

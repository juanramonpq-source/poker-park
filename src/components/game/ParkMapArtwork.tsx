import type { GameChallenge } from "@/lib/game/types";
import { cn } from "@/lib/utils";

type LandmarkKind =
  | "coaster"
  | "haunted"
  | "love"
  | "forest"
  | "chairs"
  | "restaurant"
  | "restrooms"
  | "entrance";

export type MapOrientation = "responsive" | "landscape" | "portrait";

type Landmark = {
  kind: LandmarkKind;
  label: string;
  x: number;
  y: number;
  scale?: number;
};

const LANDSCAPE_LANDMARKS: Landmark[] = [
  { kind: "coaster", label: "Montaña Rusa", x: 280, y: 205, scale: 1.08 },
  { kind: "haunted", label: "Casa del Terror", x: 1110, y: 205 },
  { kind: "love", label: "Túnel del Amor", x: 250, y: 470 },
  { kind: "forest", label: "Bosque Encantado", x: 700, y: 455, scale: 1.08 },
  { kind: "chairs", label: "Sillas Voladoras", x: 1110, y: 475 },
  { kind: "restaurant", label: "Restaurante", x: 250, y: 725 },
  { kind: "restrooms", label: "Aseos", x: 700, y: 725 },
  { kind: "entrance", label: "Entrada", x: 1110, y: 725, scale: 1.08 },
];

const PORTRAIT_LANDMARKS: Landmark[] = [
  { kind: "coaster", label: "Montaña Rusa", x: 225, y: 255, scale: 1.02 },
  { kind: "haunted", label: "Casa del Terror", x: 690, y: 255, scale: 0.92 },
  { kind: "love", label: "Túnel del Amor", x: 175, y: 605, scale: 0.88 },
  { kind: "forest", label: "Bosque Encantado", x: 450, y: 600 },
  { kind: "chairs", label: "Sillas Voladoras", x: 725, y: 605, scale: 0.88 },
  { kind: "restaurant", label: "Restaurante", x: 175, y: 990, scale: 0.9 },
  { kind: "restrooms", label: "Aseos", x: 450, y: 990, scale: 0.9 },
  { kind: "entrance", label: "Entrada", x: 725, y: 990, scale: 0.95 },
];

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g className="map-art-tree" transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 22v18" />
      <path d="M0-28-22 9h13l-17 25h52L9 9h13Z" />
    </g>
  );
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g className="map-art-lamp" transform={`translate(${x} ${y})`}>
      <path d="M0 8v26M-8 34h16" />
      <circle cx="0" cy="0" r="8" />
      <circle className="map-art-light" cx="0" cy="0" r="3" />
    </g>
  );
}

function LandmarkDrawing({ kind }: { kind: LandmarkKind }) {
  switch (kind) {
    case "coaster":
      return (
        <>
          <path className="map-landmark-fill" d="M-72 26C-51-51-19-47 0 2c19 49 50 55 72-28v61H-72Z" />
          <path d="M-72 26C-51-51-19-47 0 2c19 49 50 55 72-28" />
          <path d="M-60 31v-35M-38 31v-63M-12 31V-7M18 31V13M43 31V7M66 31v-37" />
          <g className="map-landmark-accent" transform="translate(-31 -29) rotate(14)">
            <rect x="-14" y="-7" width="28" height="14" rx="4" />
            <circle cx="-8" cy="8" r="3" /><circle cx="8" cy="8" r="3" />
          </g>
        </>
      );
    case "haunted":
      return (
        <>
          <path className="map-landmark-fill" d="m-66 35 8-68 23-18 18 13L0-72l17 34 18-13 23 18 8 68Z" />
          <path d="m-66 35 8-68 23-18 18 13L0-72l17 34 18-13 23 18 8 68M0-72v107" />
          <path className="map-landmark-accent" d="M-16 35V7a16 16 0 0 1 32 0v28M-43-18h13v17h-13zm73 0h13v17H30Z" />
          <path d="M-74 35H74" />
        </>
      );
    case "love":
      return (
        <>
          <path className="map-landmark-water" d="M-78 22c28-17 49 17 78 0s51 17 78 0v31H-78Z" />
          <path className="map-landmark-accent" d="M0 30-41-9C-67-34-30-67 0-38 30-67 67-34 41-9Z" />
          <path d="M-54 42c16-7 29-7 42 0m24 0c13-7 26-7 42 0" />
        </>
      );
    case "forest":
      return (
        <>
          <path className="map-landmark-fill" d="M-78 46c7-58 37-90 78-90s71 32 78 90Z" />
          <path d="M-47 46v-27M0 46v-55M47 46v-31" />
          <path className="map-landmark-accent" d="m-47-58-28 46h17l-22 31h66l-22-31h17Zm47-35-31 50h18l-24 34h74L13-43h18Zm47 27-25 41h15L18 3h58L57-25h15Z" />
        </>
      );
    case "chairs":
      return (
        <>
          <path className="map-landmark-fill" d="m0-69-61 32h122ZM-12-32h24v79h-24z" />
          <path d="M-56-35-72 24m128-59 16 59M-35-47-45 8m80-55 10 55M0-65v112M-38 47h76" />
          <path className="map-landmark-accent" d="M-83 19h23v19h-23zm143 0h23v19H60ZM-57 4h22v18h-22zM35 4h22v18H35Z" />
        </>
      );
    case "restaurant":
      return (
        <>
          <path className="map-landmark-fill" d="M-69-18h138v65H-69Z" />
          <path className="map-landmark-accent" d="M-78-43H78L66-11H-66Z" />
          <path d="M-52-43v31M-17-43v31m34-31v31m35-31v31M-42 47V8h35v39M18 8h31v23H18Z" />
          <path d="M-81 47H81" />
        </>
      );
    case "restrooms":
      return (
        <>
          <path className="map-landmark-fill" d="M-68-47H68v94H-68Z" />
          <path d="M0-47v94M-68-47 0-70l68 23M-50 47V0h33v47M17 47V0h33v47" />
          <g className="map-landmark-accent">
            <circle cx="-34" cy="-24" r="7" /><path d="M-34-17v24m-13 0h26M-34 7l-9 18m9-18 9 18" />
            <circle cx="34" cy="-24" r="7" /><path d="M34-17 21 12h26Zm0 29v15" />
          </g>
        </>
      );
    case "entrance":
      return (
        <>
          <path className="map-landmark-fill" d="M-78 48V-3c0-31 25-56 56-56h44c31 0 56 25 56 56v51H47V0c0-17-14-31-31-31h-32c-17 0-31 14-31 31v48Z" />
          <path d="M-87 48H87M-78-8h31m94 0h31M0-59v-28" />
          <path className="map-landmark-accent" d="m0-87 35 12L0-63Z" />
          <path d="M-31-52Q0-75 31-52" />
        </>
      );
  }
}

function MapLandmark({ landmark }: { landmark: Landmark }) {
  return (
    <g
      className={cn("map-art-landmark", `map-art-landmark-${landmark.kind}`)}
      transform={`translate(${landmark.x} ${landmark.y}) scale(${landmark.scale ?? 1})`}
    >
      <ellipse className="map-landmark-halo" cy="3" rx="104" ry="91" />
      <g className="map-landmark-drawing">
        <LandmarkDrawing kind={landmark.kind} />
      </g>
      <text className="map-landmark-label" textAnchor="middle" y="100">
        {landmark.label}
      </text>
    </g>
  );
}

function LandscapeMapContent() {
  const trees = [
    [70, 92, 0.7], [122, 105, 0.52], [505, 102, 0.58], [850, 88, 0.64],
    [1310, 118, 0.72], [1270, 390, 0.52], [82, 645, 0.62], [1320, 690, 0.58],
    [525, 790, 0.5], [855, 805, 0.55],
  ];
  return (
    <>
      <rect className="map-art-base" width="1400" height="900" />
      <path className="map-art-garden" d="M26 48c187-65 339 55 493 12 142-40 269-71 421-9 170 69 295-4 434 45v253c-155-52-279 31-433-7-159-39-276-10-420 31C347 423 184 344 26 395Z" />
      <path className="map-art-garden is-secondary" d="M31 545c146-49 297 24 431-17 154-48 296-14 443 29 165 48 310-34 465 10v291H31Z" />
      <path className="map-art-water" d="M550 294c74-67 225-72 312 6 71 64 42 141-35 179-92 46-251 24-307-53-38-52-18-89 30-132Z" />
      <path className="map-art-water-line" d="M559 330c78-45 209-49 285 7M548 379c89-43 235-37 300 14" />
      <path className="map-art-path-edge" d="M1111 775C993 686 927 617 817 596c-167-32-341 45-493-30C171 491 172 310 280 205M1112 774c59-149 53-361-2-569M698 733c11-116 0-190 2-278" />
      <path className="map-art-path" d="M1111 775C993 686 927 617 817 596c-167-32-341 45-493-30C171 491 172 310 280 205M1112 774c59-149 53-361-2-569M698 733c11-116 0-190 2-278" />
      <path className="map-art-route" d="M1111 775C993 686 927 617 817 596c-167-32-341 45-493-30C171 491 172 310 280 205M1112 774c59-149 53-361-2-569M698 733c11-116 0-190 2-278" />
      <g className="map-art-trees">
        {trees.map(([x, y, scale]) => <Tree key={`${x}-${y}`} x={x} y={y} scale={scale} />)}
      </g>
      <g className="map-art-lamps">
        {[420, 575, 890, 1000].map((x, index) => <Lamp key={x} x={x} y={index % 2 ? 624 : 590} />)}
      </g>
      {LANDSCAPE_LANDMARKS.map((landmark) => <MapLandmark key={landmark.kind} landmark={landmark} />)}
      <g className="map-art-compass" transform="translate(1282 785)">
        <circle r="55" /><path d="M0-43 14-8 0 43-14 8ZM-43 0-8-14 43 0 8 14Z" /><text textAnchor="middle" y="-64">N</text>
      </g>
      <text className="map-art-edition" x="72" y="842">PLANO OFICIAL · PENTONÚI GAMES</text>
    </>
  );
}

function LandscapeMap({ symbolId }: { symbolId?: string }) {
  return (
    <svg className="park-map-art is-landscape" viewBox="0 0 1400 900" preserveAspectRatio="none" aria-hidden>
      {symbolId ? <use href={`#${symbolId}-landscape`} width="1400" height="900" /> : <LandscapeMapContent />}
    </svg>
  );
}

function PortraitMapContent() {
  const trees = [
    [62, 105, 0.58], [115, 125, 0.46], [470, 100, 0.5], [820, 120, 0.58],
    [85, 420, 0.5], [825, 445, 0.48], [72, 820, 0.48], [830, 840, 0.55],
    [122, 1190, 0.52], [780, 1200, 0.5],
  ];
  return (
    <>
      <rect className="map-art-base" width="900" height="1320" />
      <path className="map-art-garden" d="M24 39c142-43 252 35 382 4 132-32 254-27 470 42v441c-141-36-270 25-405-9-168-42-286 15-447-27Z" />
      <path className="map-art-garden is-secondary" d="M24 750c145-42 272 22 418-14 130-32 266-16 434 38v507H24Z" />
      <path className="map-art-water" d="M315 440c54-54 180-63 257-4 73 57 64 145-8 194-78 54-219 46-280-22-49-54-30-108 31-168Z" />
      <path className="map-art-water-line" d="M316 487c69-37 180-42 254 2M302 546c74-38 207-35 280 12" />
      <path className="map-art-path-edge" d="M724 1058c-99-101-153-166-274-186-143-24-259 47-279-106-20-155 3-331 54-511M725 1058c64-204 63-538-35-803M450 988c0-163 7-257 0-388" />
      <path className="map-art-path" d="M724 1058c-99-101-153-166-274-186-143-24-259 47-279-106-20-155 3-331 54-511M725 1058c64-204 63-538-35-803M450 988c0-163 7-257 0-388" />
      <path className="map-art-route" d="M724 1058c-99-101-153-166-274-186-143-24-259 47-279-106-20-155 3-331 54-511M725 1058c64-204 63-538-35-803M450 988c0-163 7-257 0-388" />
      <g className="map-art-trees">
        {trees.map(([x, y, scale]) => <Tree key={`${x}-${y}`} x={x} y={y} scale={scale} />)}
      </g>
      <g className="map-art-lamps">
        <Lamp x={290} y={850} /><Lamp x={590} y={875} /><Lamp x={615} y={380} />
      </g>
      {PORTRAIT_LANDMARKS.map((landmark) => <MapLandmark key={landmark.kind} landmark={landmark} />)}
      <g className="map-art-compass" transform="translate(790 1175)">
        <circle r="48" /><path d="M0-37 12-7 0 37-12 7ZM-37 0-7-12 37 0 7 12Z" /><text textAnchor="middle" y="-57">N</text>
      </g>
      <text className="map-art-edition" x="55" y="1260">PLANO OFICIAL · PENTONÚI GAMES</text>
    </>
  );
}

function PortraitMap({ symbolId }: { symbolId?: string }) {
  return (
    <svg className="park-map-art is-portrait" viewBox="0 0 900 1320" preserveAspectRatio="none" aria-hidden>
      {symbolId ? <use href={`#${symbolId}-portrait`} width="900" height="1320" /> : <PortraitMapContent />}
    </svg>
  );
}

export function ParkMapArtworkSymbols({
  id,
  orientation = "responsive",
}: {
  id: string;
  orientation?: MapOrientation;
}) {
  return (
    <svg className="park-map-art-definitions" width="0" height="0" aria-hidden="true">
      <defs>
        {orientation !== "portrait" ? (
          <symbol id={`${id}-landscape`} viewBox="0 0 1400 900">
            <LandscapeMapContent />
          </symbol>
        ) : null}
        {orientation !== "landscape" ? (
          <symbol id={`${id}-portrait`} viewBox="0 0 900 1320">
            <PortraitMapContent />
          </symbol>
        ) : null}
      </defs>
    </svg>
  );
}

export function ParkMapArtwork({
  challenge,
  className,
  symbolId,
  orientation = "responsive",
}: {
  challenge: GameChallenge;
  className?: string;
  symbolId?: string;
  orientation?: MapOrientation;
}) {
  return (
    <div className={cn("park-map-artwork", className)} data-map-art={challenge} aria-hidden="true">
      {orientation !== "portrait" ? <LandscapeMap symbolId={symbolId} /> : null}
      {orientation !== "landscape" ? <PortraitMap symbolId={symbolId} /> : null}
    </div>
  );
}

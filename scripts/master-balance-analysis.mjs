// Offline experiment: candidate rules live only in an isolated copy, never in the app.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const count = Number(process.argv[2] ?? 200);
const root = resolve('artifacts');
mkdirSync(root, { recursive: true });
const output = [];
const baselineRef = 'e3b166118d0144f318bf892a8bb46aa25a9c7116';
const sources = execFileSync('git', ['ls-tree', '-r', '--name-only', baselineRef, 'src/lib/game'], { encoding: 'utf8' }).trim().split('\n').filter(path => path.endsWith('.ts'));
function random(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let x = Math.imul(seed ^ seed >>> 15, 1 | seed);
    x ^= x + Math.imul(x ^ x >>> 7, 61 | x);
    return ((x ^ x >>> 14) >>> 0) / 4294967296;
  };
}
for (const variant of ['baseline', 'keys', 'jacks', 'both']) {
  const folder = mkdtempSync(join(root, 'master-balance-'));
  for (const source of sources) writeFileSync(join(folder, source.slice('src/lib/game/'.length)), execFileSync('git', ['show', `${baselineRef}:${source}`]));
  const change = (file, before, after) => {
    const path = join(folder, file);
    const text = readFileSync(path, 'utf8');
    assert(text.includes(before), `Analysis adapter drifted: ${file}: ${before}`);
    writeFileSync(path, text.replace(before, after));
  };
  const masters = "['festival','mirror','storm','impossible'].includes(state.challenge ?? '')";
  // The same agent knows how to use an available box in every experiment.
  change('ai.ts', 'import { isAce, isFace }', 'import { playableCards } from "./night-tools.ts";\nimport { isAce, isFace }');
  change('ai.ts', 'const hand = state.hands[state.currentPlayer];', 'const hand = playableCards(state);');
  if (variant === 'jacks' || variant === 'both') {
    change('night-tools.ts', 'state.challenge === "night" && state.mode === "solo" && Boolean(state.night)', `(state.challenge === "night" || ${masters}) && state.mode === "solo" && Boolean(state.night)`);
    change('night-tools.ts', 'return hasJackBox(state) && state.difficulty', 'return state.challenge === "night" && hasJackBox(state) && state.difficulty');
    change('engine.ts', ': undefined,\n    festival:', ': ["festival","mirror","storm","impossible"].includes(challenge) && solo ? { unlocked: [...ATTRACTION_IDS], route: [], pendingUnlock: false, emergencyUses: 0, jackBox: [] } : undefined,\n    festival:');
  }
  if (variant === 'keys' || variant === 'both') {
    change('engine.ts', 'if (!isNightShift(state)) return [];', `if (!isNightShift(state) && !(${masters})) return [];`);
    change('engine.ts', 'if (isNightShift(state) && isFace(card))', `if ((isNightShift(state) || ${masters}) && isFace(card))`);
  }
  const e = await import(pathToFileURL(join(folder, 'engine.ts')).href);
  const { chooseAiMove } = await import(pathToFileURL(join(folder, 'ai.ts')).href);
  for (const mode of ['solo', 'hotseat']) for (const challenge of ['classic', 'night', 'festival', 'mirror', 'storm', 'impossible']) {
    // Jack storage intentionally follows the original solo-only mechanic.
    if (mode !== 'solo' && variant === 'jacks') continue;
    const data = { variant, mode, challenge, games: count, solved: 0, fivePlus: 0, totalCompleted: 0, totalPlaced: 0, earlyBlocks: 0, keyUses: 0, unusedDeck: 0, capped: 0, agentStops: 0 };
    for (let seed = 1; seed <= count; seed++) {
      const originalRandom = Math.random;
      Math.random = random(seed);
      try {
        let g = e.createGame(mode, undefined, challenge, 'standard');
        let n = 0;
        let agentStopped = false;
        for (; n < 300 && !g.ended && !e.parkSolved(g); n++) {
          if (g.night?.pendingUnlock) { g = e.unlockNightAttraction(g, e.nightUnlockChoices(g)[0]); continue; }
          if (g.pendingAdvance) { g = e.advanceTurn(g); continue; }
          if (e.nightEmergencyAvailable(g)) { g = e.unlockNightAttraction(g, e.nightUnlockChoices(g)[0], true); continue; }
          if (e.visitorPhase(g)) break;
          const move = chooseAiMove(g);
          if (move.type === 'place') g = e.placeCard(g, move.cardId, move.attractionId, move.index);
          else if (move.type === 'exchange') {
            if (move.target.kind === 'ace-rack') data.keyUses++;
            g = e.exchangeCard(g, move.cardId, move.target);
          } else if (move.type === 'visit') g = e.placeVisitor(g, move.cardId, move.attractionId);
          else {
            if (e.hasRequiredAction(g)) { agentStopped = true; data.agentStops++; break; }
            g = e.passTurn(g);
          }
        }
        const completed = e.completedAttractions(g).length;
        data.solved += completed === 7 ? 1 : 0;
        data.fivePlus += completed >= 5 ? 1 : 0;
        data.totalCompleted += completed;
        data.totalPlaced += Object.values(g.attractions).flatMap(a => a.slots).filter(Boolean).length;
        data.earlyBlocks += !agentStopped && g.deck.length > 10 && completed < 7 ? 1 : 0;
        data.unusedDeck += g.deck.length;
        data.capped += n === 300 ? 1 : 0;
      } finally { Math.random = originalRandom; }
    }
    output.push(data);
    console.log(JSON.stringify(data));
  }
}
writeFileSync(join(root, 'master-balance-results.json'), JSON.stringify({ baselineRef, count, seedRange: [1, count], policy: 'Existing greedy AI, box-aware; no hidden-deck lookahead. Not human win rates.', output }, null, 2));

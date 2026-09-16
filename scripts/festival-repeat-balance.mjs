import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve('artifacts'); mkdirSync(root, { recursive: true });
const files = execFileSync('git', ['ls-tree','-r','--name-only','HEAD','src/lib/game'],{encoding:'utf8'}).trim().split('\n').filter(f => f.endsWith('.ts'));
const results = [];
for (const variant of ['before','repeat','extra2']) {
 const folder = mkdtempSync(join(root,'repeat-balance-'));
 for (const file of files) writeFileSync(join(folder,file.split('/').at(-1)), variant === 'before' ? execFileSync('git',['show',`HEAD:${file}`]) : readFileSync(file));
 // Identical policy in each arm: sees the existing box and avoids consecutive destinations.
 let ai = readFileSync(join(folder,'ai.ts'),'utf8');
 if (variant === 'before') ai = ai.replace('import { hasMirrorRules }','import { playableCards } from "./night-tools.ts";\nimport { hasFestivalRules, hasMirrorRules }').replace('  let score = 12;', '  if (hasFestivalRules(state) && state.festival?.lastAttractionId === attractionId) return -10000;\n  let score = 12;').replace('const hand = state.hands[state.currentPlayer];','const hand = playableCards(state);');
 writeFileSync(join(folder,'ai.ts'),ai);
 if (variant === 'extra2') { let e = readFileSync(join(folder,'engine.ts'),'utf8').replace('case "festival":\n      return 4;', 'case "festival":\n      return 6;').replace('case "impossible":\n      return 6;','case "impossible":\n      return 8;'); writeFileSync(join(folder,'engine.ts'), e); }
 const e = await import(pathToFileURL(join(folder,'engine.ts'))); const { chooseAiMove } = await import(pathToFileURL(join(folder,'ai.ts')));
 for (const mode of ['solo','hotseat']) for (const challenge of ['festival','impossible']) {
  const row = {variant,mode,challenge,games:200,solved:0,repeat:0,total:0,capped:0};
  for(let seed=1;seed<=200;seed++) { let x=seed; const old=Math.random; Math.random=()=>{ x|=0; x=x+0x6D2B79F5|0; let t=Math.imul(x^x>>>15,1|x); t^=t+Math.imul(t^t>>>7,61|t); return ((t^t>>>14)>>>0)/4294967296; };
   try { let g=e.createGame(mode,undefined,challenge,'standard'); let n=0;
    for(;n<300 && !g.ended && !e.parkSolved(g);n++) { if(g.pendingAdvance){g=e.advanceTurn(g);continue;} if(e.visitorPhase(g))break;
     const m=chooseAiMove(g); if(m.type==='place')g=e.placeCard(g,m.cardId,m.attractionId,m.index); else if(m.type==='exchange')g=e.exchangeCard(g,m.cardId,m.target);else if(e.hasRequiredAction(g))break;else g=e.passTurn(g);
    }
    const done=e.completedAttractions(g).length; row.total+=done; row.solved+=done===7&&g.endReason!=='repeat'?1:0; row.repeat+=g.endReason==='repeat'?1:0;row.capped+=n===300?1:0;
   } finally {Math.random=old;}
  } row.mean=row.total/200; results.push(row); console.log(JSON.stringify(row));
 }
}
writeFileSync(join(root,'festival-repeat-balance.json'),JSON.stringify({gamesPerArm:200,policy:'Same greedy box-aware AI, repetition penalty; no hidden deck lookahead. Not human victory rates.',results},null,2));

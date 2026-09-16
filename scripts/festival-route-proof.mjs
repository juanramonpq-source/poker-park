import assert from 'node:assert/strict';
import { createGame, beginTurn, placeCard, advanceTurn, legalPlacements, completedAttractions } from '../src/lib/game/engine.ts';
import { legalSlotsForCard } from '../src/lib/game/attractions.ts';
import { makeDeck } from '../src/lib/game/deck.ts';
import { stormClosedAttraction } from '../src/lib/game/challenges.ts';
import { completedPark } from './fixtures/completed-park.ts';
import { playableCards } from '../src/lib/game/night-tools.ts';
import { writeFileSync, mkdirSync } from 'node:fs';
const proofs=[];
for(const challenge of ['festival','impossible']) for(const mode of ['solo','hotseat']) {
 const target=completedPark(mode,challenge); const plan=createGame(mode,undefined,challenge);
 const route=[]; let nodes=0;
 function search(last,step) {
  if(step===46)return true;
  if(++nodes>200000)return false;
  if(plan.storm)plan.storm.index=step%7;
  const choices=[];
  for(const [id,attr] of Object.entries(plan.attractions)) {
   if(id===last || stormClosedAttraction(plan)===id) continue;
   for(const [index,card] of target.attractions[id].slots.entries())
    if(!attr.slots[index] && legalSlotsForCard(id,attr.slots,card,challenge==='impossible').includes(index)) choices.push({id,index,card,left:attr.slots.filter(c=>!c).length});
  }
  choices.sort((a,b)=>b.left-a.left);
  for(const move of choices) {route.push(move);plan.attractions[move.id].slots[move.index]=move.card;
   if(search(move.id,step+1))return true;
   plan.attractions[move.id].slots[move.index]=null;route.pop();
  } return false;
 }
 assert.ok(search(null,0),`No full route ${challenge}/${mode}`);
 const g0=createGame(mode,undefined,challenge);g0.storm=plan.storm?{...plan.storm,index:0}:undefined;
 if(g0.jackBox)g0.jackBox=[];
 const initial=mode==='solo'?5:3;const hands=[[],[]];const initialIds=new Set();
 for(let player=0;player<(mode==='solo'?1:2);player++) for(const move of route.filter((_,i)=>mode==='solo'||i%2===player).slice(0,initial)) {hands[player].push(move.card);initialIds.add(move.card.id);}
 const allIds=new Set(route.map(m=>m.card.id));const spare=makeDeck().filter(c=>!allIds.has(c.id));
 g0.hands=hands;g0.entrance=spare.slice(0,2);g0.deck=[...route.filter(m=>!initialIds.has(m.card.id)).map(m=>m.card),...spare.slice(2)].reverse();
 assert.equal(new Set([...g0.hands.flat(),...g0.deck,...g0.entrance].map(c=>c.id)).size,52);
 // Actual opening draw, including the solo jack storage used by the engine.
 let g=beginTurn({...g0,drawnThisTurn:false,currentPlayer:0});
 for(const move of route){
  assert.ok(playableCards(g).some(c=>c.id===move.card.id),`card not available ${challenge}/${mode}/${move.card.id}`);
  assert.ok(legalPlacements(g,move.card.id).some(p=>p.attractionId===move.id&&p.index===move.index));
  g=placeCard(g,move.card.id,move.id,move.index);
  if(g.pendingAdvance)g=advanceTurn(g);
  assert.notEqual(g.endReason,'repeat');
 }
 assert.equal(completedAttractions(g).length,7);
 assert.equal(g.exchangesUsed,0);
 proofs.push({challenge,mode,placements:route.length,exchanges:0,completed:7,route:route.map(m=>`${m.id}:${m.card.id}:${m.index}`)});
}
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/festival-route-proof.json',JSON.stringify(proofs,null,2));console.log(proofs.map(({route,...proof})=>proof));

import assert from 'node:assert/strict';
import { webkit } from 'playwright';
import { mkdirSync } from 'node:fs';
const url=process.argv[2]??'http://127.0.0.1:8080';
const browser=await webkit.launch();
mkdirSync('screenshots',{recursive:true});
try {
for(const width of [390,1280]) {
 const page=await browser.newPage({viewport:{width,height:width===390?844:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 const studio=page.getByRole('button',{name:/Pentonúi Games.*Toca/});
 await studio.waitFor();
 await page.waitForTimeout(1000); // Let the existing studio fade-in finish.
 assert.equal(await page.locator('.opening-studio-face-back').evaluate(el=>getComputedStyle(el).visibility),'hidden','Only the original face should show before the turn');
 await page.screenshot({path:`screenshots/studio-bright-${width}.png`});
 await studio.click();
 // The old opening jumped straight to the ticket, omitting the flower turn.
 assert.equal(await page.locator('.title-screen').getAttribute('data-opening'),'studio-turn');
 assert.equal(await studio.isDisabled(),true);
 await page.waitForTimeout(1850);
 const orientation=await page.locator('.opening-studio-flower').evaluate(el=>{
  const style=getComputedStyle(el);
  const back=el.querySelector('.opening-studio-face-back');
  const matrix=new DOMMatrix(style.transform).multiply(new DOMMatrix(back ? getComputedStyle(back).transform : undefined));
  const red=matrix.transformPoint(new DOMPoint(0,-100,0));
  const blue=matrix.transformPoint(new DOMPoint(-80,60,0));
  const green=matrix.transformPoint(new DOMPoint(80,60,0));
  return {red:{x:red.x,y:red.y},blue:{x:blue.x,y:blue.y},green:{x:green.x,y:green.y},opacity:back ? Number(getComputedStyle(back).opacity) : 0,visibility:back ? getComputedStyle(back).visibility : 'hidden'};
 });
 assert(orientation.red.y<0 && Math.abs(orientation.red.x)<.1,'Red must end above the centre');
 assert(Math.abs(orientation.blue.x+80)<.1 && Math.abs(orientation.blue.y-60)<.1,'Blue must occupy the original lower-left triangle position');
 assert(orientation.green.x>0 && orientation.green.y>0,'Green must remain on the lower-right axis');
 assert(Math.abs(orientation.green.x-80)<.1 && Math.abs(orientation.green.y-60)<.1,'Green must stay on the fixed rotation axis');
 assert(orientation.opacity>.5,'Final orientation must remain visible before fading');
 assert.equal(orientation.visibility,'visible');
 await page.screenshot({path:`screenshots/studio-turned-${width}.png`});
 await page.locator('.title-screen[data-opening="ticket"]').waitFor();
 assert(await page.getByRole('button',{name:'Rasgar y validar la entrada de Poker Park'}).isEnabled());
 await page.screenshot({path:`screenshots/studio-ticket-${width}.png`});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({width,orientation,ticket:true,errors}));
 await page.close();
}
const skip=await browser.newPage();
await skip.goto(url);
await skip.getByRole('button',{name:/Pentonúi Games.*Toca/}).click();
await skip.getByRole('button',{name:'Omitir apertura'}).click();
await skip.waitForTimeout(2700);
assert.equal(await skip.locator('.title-screen').getAttribute('data-opening'),'ready','Skipping must cancel the delayed ticket transition');
const reduced=await browser.newPage({reducedMotion:'reduce'});
await reduced.goto(url);
await reduced.getByRole('button',{name:/Pentonúi Games.*Toca/}).click();
await reduced.locator('.title-screen[data-opening="ticket"]').waitFor({timeout:1000});
console.log('Skip cancels the turn; reduced motion goes directly to the ticket.');
} finally {await browser.close();}

// ValeDouro WEBIA — Mana arcana, progressão e sobrecarga
(function(){
'use strict';
const ARCANE_CLASSES=['Mago','Feiticeiro','Bruxo'];
const COSTS={0:0,1:2,2:4,3:6,4:9,5:12,6:16,7:21,8:27,9:34};
const AF_LABELS=[
 {max:0,label:'Normal'},
 {max:2,label:'Desgaste leve'},
 {max:4,label:'Cansaço arcano'},
 {max:6,label:'Exaustão arcana'},
 {max:Infinity,label:'Colapso arcano'}
];
function isArcane(c){return (c?.classes||[]).some(x=>ARCANE_CLASSES.includes(x.name));}
function arcaneLevels(c){return (c?.classes||[]).filter(x=>ARCANE_CLASSES.includes(x.name)).reduce((a,x)=>a+(Number(x.level)||0),0);}
function intMod(c){return Math.floor(((Number(c?.attrs?.INT)||10)-10)/2);}
function d(sides){return Math.floor(Math.random()*sides)+1;}
function ensure(c){
 if(!c||!isArcane(c))return c;
 c.arcaneFatigue=Math.max(0,Number(c.arcaneFatigue||0));
 if(c.manaMax!=null)c.mana=Math.max(0,Math.min(Number(c.mana??c.manaMax),Number(c.manaMax)));
 return c;
}
function rollInitial(c){
 if(!isArcane(c))return null;
 if(c.manaMax!=null)return c.manaRoll||null;
 const original=[d(10),d(10),d(10)],final=[...original],rerolled=[];
 original.forEach((v,i)=>{if(v<3){final[i]=d(10);rerolled.push({index:i,from:v,to:final[i]});}});
 const sorted=[...final].sort((a,b)=>b-a),base=sorted[0]+sorted[1],im=intMod(c),levels=Math.max(1,arcaneLevels(c));
 const levelRolls=[];let growth=0,b=Math.max(0,Math.floor(im/2));
 for(let level=2;level<=levels;level++){const die=d(6),gain=die+b;levelRolls.push({level,die,intBonus:b,gain});growth+=gain;}
 c.manaBase=base;c.manaMax=Math.max(1,base+im+growth);c.mana=c.manaMax;c.arcaneFatigue=0;
 c.manaRoll={original,final,rerolled,discarded:Math.min(...final),base,intModifier:im,levelRolls,total:c.manaMax,rolledAt:new Date().toISOString()};
 persist();return c.manaRoll;
}
function levelUp(c,levels=1){ensure(c);if(!isArcane(c)||c.manaMax==null)return null;const b=Math.max(0,Math.floor(intMod(c)/2)),rolls=[];for(let i=0;i<levels;i++){const die=d(6),gain=die+b;c.manaMax+=gain;c.mana+=gain;rolls.push({die,intBonus:b,gain});}persist();return rolls;}
function spend(c,amount){ensure(c);amount=Math.max(0,Number(amount)||0);if(!isArcane(c)||c.manaMax==null)return {ok:false,reason:'not-arcane'};if(c.mana<amount)return {ok:false,reason:'insufficient',missing:amount-c.mana};c.mana-=amount;persist();refreshUI();return {ok:true,spent:amount,mana:c.mana};}
function overload(c,cost){ensure(c);cost=Math.max(0,Number(cost)||0);if(!isArcane(c)||c.manaMax==null)return {ok:false,reason:'not-arcane'};const missing=Math.max(0,cost-c.mana);const spent=Math.min(c.mana,cost);c.mana-=spent;c.arcaneFatigue+=missing;const collapse=c.arcaneFatigue>=7;persist();refreshUI();return {ok:true,spent,missing,arcaneFatigue:c.arcaneFatigue,collapse};}
function restore(c,ratio){ensure(c);if(!isArcane(c)||c.manaMax==null)return 0;const before=c.mana,amount=Math.max(1,Math.floor(c.manaMax*Math.max(0,Number(ratio)||0)));c.mana=Math.min(c.manaMax,c.mana+amount);persist();refreshUI();return c.mana-before;}
function reduceFatigue(c,points){ensure(c);if(!isArcane(c))return 0;const before=c.arcaneFatigue;c.arcaneFatigue=Math.max(0,c.arcaneFatigue-Math.max(0,Number(points)||0));persist();refreshUI();return before-c.arcaneFatigue;}
function fatigueLabel(c){const v=Math.max(0,Number(c?.arcaneFatigue||0));return AF_LABELS.find(x=>v<=x.max)?.label||'Colapso arcano';}
function spellCost(circle){return COSTS[Math.max(0,Math.min(9,Number(circle)||0))];}
function stateFor(c){ensure(c);return !isArcane(c)?null:{mana:c.mana??null,manaMax:c.manaMax??null,arcaneFatigue:c.arcaneFatigue||0,arcaneFatigueLabel:fatigueLabel(c)};}
function persist(){try{if(typeof saveChars==='function')saveChars()}catch(e){console.warn('Mana não persistida',e)}}
function bar(c){if(!isArcane(c)||c.manaMax==null)return '';const pct=Math.max(0,Math.min(100,Math.round((c.mana/c.manaMax)*100)));return `<div class="mana-block"><div class="mana-line"><span>Mana</span><strong>${c.mana}/${c.manaMax}</strong></div><div class="mana-track"><span style="width:${pct}%"></span></div>${c.arcaneFatigue?`<small>Fadiga Arcana ${c.arcaneFatigue} — ${fatigueLabel(c)}</small>`:''}</div>`;}
function refreshUI(){try{if(typeof renderParty==='function')renderParty();}catch{} }
const originalRender=window.renderParty; if(typeof originalRender==='function')window.renderParty=function(){originalRender.apply(this,arguments);document.querySelectorAll('.pc').forEach((el,i)=>{const c=state.characters[i];const old=el.querySelector('.mana-block');if(old)old.remove();if(c)el.insertAdjacentHTML('beforeend',bar(c));});};
const originalSheet=window.sheet; if(typeof originalSheet==='function')window.sheet=function(c){const html=originalSheet(c);const m=bar(c);return m?html+`<div class="sheet-section"><h4>Reserva Arcana</h4>${m}<p class="muted">Mana substitui slots para magia arcana. Truques custam 0.</p></div>`:html;};
const originalReview=window.showReview; if(typeof originalReview==='function')window.showReview=function(){originalReview.apply(this,arguments);state.characters.forEach((c,i)=>{if(!isArcane(c)||c.manaMax!=null)return;const card=document.querySelectorAll('#reviewCards .char-card')[i];if(card)card.insertAdjacentHTML('beforeend',`<div class="mana-roll-box" id="manaRoll${i}"><p><strong>Mana arcana ainda não definida.</strong></p><button class="btn primary" onclick="rollCharacterMana(${i})">🎲 Rolar Mana (3d10)</button></div>`);});};
window.rollCharacterMana=function(i){const c=state.characters[i],r=rollInitial(c);if(!r)return;const box=document.getElementById(`manaRoll${i}`);if(box)box.innerHTML=`<p><strong>Mana:</strong> ${r.original.join(' • ')}${r.rerolled.length?` → rerrolagens: ${r.rerolled.map(x=>`${x.from}→${x.to}`).join(', ')}`:''}</p><p>Resultados finais: ${r.final.join(' • ')} • descarta ${r.discarded} • base ${r.base} • INT ${r.intModifier>=0?'+':''}${r.intModifier}${r.levelRolls.length?` • progressão ${r.levelRolls.map(x=>`+${x.gain}`).join(', ')}`:''}</p><h3>Mana Máxima: ${r.total}</h3>`;saveChars?.();};
const originalStart=window.startAdventure; if(typeof originalStart==='function')window.startAdventure=async function(){const pending=state.characters.filter(c=>isArcane(c)&&c.manaMax==null);if(pending.length)return alert(`Defina a Mana de: ${pending.map(c=>c.name).join(', ')}.`);return originalStart.apply(this,arguments);};
window.ValeMana={ARCANE_CLASSES,COSTS,isArcane,arcaneLevels,ensure,rollInitial,levelUp,spend,overload,restore,reduceFatigue,fatigueLabel,spellCost,stateFor,bar};
// Compatibilidade com módulos que usam window.state.
try{if(!window.state)window.state=state;}catch{}
})();
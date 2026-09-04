// ValeDouro WEBIA — descanso, fadiga, mana e ferimentos persistentes
(()=>{
'use strict';
const RULES={
 short:{label:'Descanso Curto',minHours:.5,maxHours:1.5,mana:.10,hp:.00,fatigue:-15,arcaneFatigue:0},
 medium:{label:'Descanso Médio',minHours:4,maxHours:6,mana:.35,hp:.05,fatigue:-45,arcaneFatigue:-1},
 normal:{label:'Descanso',minHours:6,maxHours:8,mana:.70,hp:.10,fatigue:-75,arcaneFatigue:-2},
 long:{label:'Descanso Longo',minHours:8,maxHours:12,mana:1,hp:.15,fatigue:-100,arcaneFatigue:-3}
};
const SEVERITY={superficial:.95,moderate:.80,grave:.70,critical:.50};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function ensure(c){if(!c)return c;c.fatigue=clamp(Number(c.fatigue||0),0,100);c.injuries=Array.isArray(c.injuries)?c.injuries:[];if(c.manaMax!=null)c.mana=clamp(Number(c.mana??c.manaMax),0,Number(c.manaMax));c.arcaneFatigue=Math.max(0,Number(c.arcaneFatigue||0));return c;}
function injuryCap(c){ensure(c);let cap=Number(c.hpMax||1);for(const i of c.injuries.filter(x=>x.active!==false)){if(Number.isFinite(Number(i.hpMaxCap)))cap=Math.min(cap,Number(i.hpMaxCap));else cap=Math.min(cap,Math.floor(Number(c.hpMax||1)*(SEVERITY[i.severity]||.8)));}return Math.max(1,cap);}
function addInjury(c,injury={}){ensure(c);const severity=SEVERITY[injury.severity]?injury.severity:'moderate';const item={id:injury.id||`inj-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name:injury.name||'Ferimento',severity,description:injury.description||'',active:true,treated:!!injury.treated,structural:injury.structural!==false,createdAt:new Date().toISOString(),hpMaxCap:injury.hpMaxCap??null};c.injuries.push(item);c.hp=Math.min(Number(c.hp||0),injuryCap(c));persist();return item;}
function treatInjury(c,id,notes=''){ensure(c);const i=c.injuries.find(x=>x.id===id);if(!i)return null;i.treated=true;i.treatmentNotes=notes;i.treatedAt=new Date().toISOString();persist();return i;}
function resolveInjury(c,id){ensure(c);const i=c.injuries.find(x=>x.id===id);if(!i)return null;i.active=false;i.resolvedAt=new Date().toISOString();persist();return i;}
function applyHealingMagic(c,amount=0){ensure(c);const cap=injuryCap(c),before=Number(c.hp||0);c.hp=clamp(before+Math.max(0,Number(amount)||0),0,cap);persist();return {before,after:c.hp,restored:c.hp-before,cap,injuriesRemain:c.injuries.some(x=>x.active!==false)};}
function classify(hours,context=''){const h=Number(hours)||0,s=String(context).toLowerCase();if(h>=8||/exaust|assistência médica|assistencia medica|sono muito profundo|descanso longo/.test(s))return 'long';if(h>=6&&!/cochil|emergência|emergencia|vigília|vigilia/.test(s))return 'normal';if(h>=4)return 'medium';if(h>=.5)return 'short';return null;}
function rest(c,type,hours){ensure(c);type=RULES[type]?type:classify(hours);if(!type)return null;const r=RULES[type],before={hp:Number(c.hp||0),mana:c.mana??null,fatigue:c.fatigue,arcaneFatigue:c.arcaneFatigue};c.fatigue=clamp(c.fatigue+r.fatigue,0,100);if(c.manaMax!=null){const gain=Math.max(1,Math.floor(Number(c.manaMax)*r.mana));c.mana=clamp(Number(c.mana||0)+gain,0,Number(c.manaMax));}c.arcaneFatigue=Math.max(0,c.arcaneFatigue+r.arcaneFatigue);const cap=injuryCap(c),natural=Math.floor(Number(c.hpMax||0)*r.hp);c.hp=clamp(Number(c.hp||0)+natural,0,cap);c.lastRest={type,label:r.label,hours:Number(hours)||r.minHours,at:new Date().toISOString()};let recoveredFeatures=[];try{window.ValeInjuries?.advanceTime?.(c,Number(hours)||r.minHours);}catch{}try{recoveredFeatures=window.ValeClassFeatures?.recoverForRest?.(c,type)||[]}catch{}persist();return {type,label:r.label,before,after:{hp:c.hp,mana:c.mana??null,fatigue:c.fatigue,arcaneFatigue:c.arcaneFatigue},hpCap:cap,activeInjuries:c.injuries.filter(x=>x.active!==false).length,recoveredFeatures};}
function restParty(type,hours){const results=(state.characters||[]).map(c=>({name:c.name,result:rest(c,type,hours)}));saveChars?.();return results;}
function persist(){try{if(typeof saveChars==='function')saveChars()}catch(e){console.warn('Não foi possível persistir vitais',e)}}
function publicState(){return (state.characters||[]).map(c=>{ensure(c);return {name:c.name,hp:c.hp,hpMax:c.hpMax,hpFunctionalCap:injuryCap(c),mana:c.mana??null,manaMax:c.manaMax??null,fatigue:c.fatigue,arcaneFatigue:c.arcaneFatigue||0,injuries:c.injuries.filter(x=>x.active!==false).map(i=>({name:i.name,severity:i.severity,treated:i.treated,structural:i.structural,description:i.description})),lastRest:c.lastRest||null}})}
window.ValeDouroRest={RULES,ensure,injuryCap,addInjury,treatInjury,resolveInjury,applyHealingMagic,classify,rest,restParty,publicState};
})();
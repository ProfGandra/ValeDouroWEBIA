// ValeDouro WEBIA — Diário episódico orientado a intenção -> resolução -> fato consolidado
(function(){
'use strict';
if(window.__VALE_JOURNAL_EPISODIC_BRIDGE__)return;
window.__VALE_JOURNAL_EPISODIC_BRIDGE__=true;

const PENDING_KEY='valedouro.journal.pending.v1';
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
const activeCharacter=()=>window.state?.characters?.[window.state?.active||0]||null;
const charKey=c=>`${c?.name||'sem-nome'}|${c?.cls||''}`;
function actionHash(s){let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function readPending(){try{return JSON.parse(localStorage.getItem(PENDING_KEY)||'{}')||{}}catch{return {}}}
function getPending(c){return readPending()[charKey(c)]||null}
function setPending(c,v){const db=readPending(),k=charKey(c);if(v)db[k]=v;else delete db[k];localStorage.setItem(PENDING_KEY,JSON.stringify(db))}
function isRollResult(a){return /resultado do teste de|resultado do teste solicitado|\bd20\b.*\bcd\b|;\s*(sucesso|falha)\s*;/i.test(String(a||''))}
function rollOutcome(a){const t=norm(a);if(/\bfalha\b/.test(t))return 'failure';if(/\bsucesso\b/.test(t))return 'success';return null}
function classify(action){
  const t=norm(action);if(!t||isRollResult(t))return null;
  const accidental=/\b(sem intencao|sem querer|acidentalmente|por acidente|descuidado|descuidada|involuntariamente)\b/.test(t);
  const deliberate=/\b(deliberadamente|de proposito|intencionalmente|com intencao|quero ferir|quero machucar)\b/.test(t);
  const aid=/\b(presto|prestar|aplico|aplicar|faco|fazer)\b.*\b(primeiros socorros|curativo|curativos|socorro)\b|\b(ajudo|socorro|trato|cuido|estanco)\b.*\b(ferid|sangramento|machucad)/.test(t);
  const injuryAct=/\b(golpeio|esfaqueio|corto|estoco|agredo|desfiro|acerto|firo|ferindo|feri|machuco|apunhalo|cravo|perfuro)\b/.test(t)
    ||/\b(faco|causo|provoco|abro|deixo)\b[^.!?]{0,50}\b(um\s+)?(ferimento|corte|machucado|lesao)\b/.test(t)
    ||/\b(faco|causo|provoco)\b[^.!?]{0,50}\b(sangrar|sangramento)\b/.test(t)
    ||/sac\w*\s+(minha\s+)?(espada|faca|adaga|machado).*\b(golpe|atac|cort|estoc|fer|crav|perfur)/.test(t);
  if(aid)return {type:'aid',action:String(action)};
  if(accidental&&injuryAct)return {type:'accident',action:String(action)};
  if(/\b(mato|executo|degolo|assassino|tiro a vida|ceifo a vida|acabo com ele|acabo com ela)\b/.test(t))return {type:'killing',action:String(action)};
  if(injuryAct||deliberate&&/\b(ferimento|corte|lesao|machucado)\b/.test(t))return {type:'assault',action:String(action)};
  if(/\b(furto|roubo|roubar|assalto|assaltar|subtraio|tomo para mim)\b/.test(t))return {type:'theft',action:String(action)};
  if(/\b(ameaco|intimido|vou te matar|juro que mato)\b/.test(t))return {type:'threat',action:String(action)};
  if(/\b(minto|mentira|engano|finjo que|invento que)\b/.test(t))return {type:'deception',action:String(action)};
  return null;
}
function latestAssistant(){const h=Array.isArray(window.state?.history)?window.state.history:[];for(let i=h.length-1;i>=0;i--)if(h[i]?.role==='assistant')return String(h[i].content||'');return ''}
function asksRoll(text){return /\[\[ROLL:/i.test(String(text||''))}
function deathConfirmed(text){return /\b(morreu|morto|morta|sem vida|morte confirmada|nao sobreviveu|não sobreviveu|deixa de respirar|parou de respirar)\b/i.test(String(text||''))}
function injuryConfirmed(text){return /\b(ferid[oa]|ferimento|sangr|corte|cortou|rasga|rasgou|atinge|atingiu|crava|cravou|perfura|perfurou|dor|machuc)/i.test(String(text||''))}
function theftSucceeded(text){return /\b(consegue|conseguiu|retira|retirou|toma|tomou|subtrai|subtraiu|furta|furtou|rouba|roubou|agora possui|fica com)\b/i.test(String(text||''))&&!/\b(nao consegue|não consegue|falha|impedido|percebido antes|mãos vazias|maos vazias)\b/i.test(String(text||''))}
function aidConfirmed(text){return /\b(estanca|estancou|sangramento diminui|sangramento parou|curativo|estabiliz|primeiros socorros|ferida limpa|melhora|respira mais calmamente|sob controle)\b/i.test(String(text||''))}
function thirdPartyInjury(text){return /\b(pedestre|transeunte|outra pessoa|terceiro|alguem ao lado|alguém ao lado)\b[^.!?]{0,100}\b(ferid|sangr|corte|rasga|ating)/i.test(String(text||''))}
function entryFor(intent,response,outcome){
  const t=intent.type;
  if(t==='killing'){
    if(deathConfirmed(response))return {title:'Uma vida ceifada',body:'Hoje tentei tirar uma vida — e consegui. A morte foi consequência direta da minha escolha.'};
    if(outcome==='failure'||/\b(escapa|escapou|foge|fugiu|ainda vivo|permanece vivo|sobrevive)\b/i.test(response)){
      const extra=thirdPartyInjury(response)?' Na confusão, outra pessoa acabou ferida.':'';
      return {title:'Tentei tirar uma vida',body:`Hoje tentei matar alguém, mas não consegui.${extra}`};
    }
    return injuryConfirmed(response)?{title:'Sangue pela minha mão',body:'Hoje tentei tirar uma vida. O golpe feriu alguém, mas não há confirmação de morte.'}:null;
  }
  if(t==='assault'){
    if(deathConfirmed(response))return {title:'Sangue e consequência',body:'Hoje ergui minha arma contra outra pessoa, e o confronto terminou em morte.'};
    if(injuryConfirmed(response))return {title:'Sangue pela minha mão',body:'Hoje escolhi ferir outra pessoa, e meu golpe teve consequência real.'};
    if(outcome==='failure')return {title:'Um golpe frustrado',body:'Hoje tentei ferir alguém, mas meu ataque não alcançou o resultado que eu pretendia.'};
    return null;
  }
  if(t==='accident')return injuryConfirmed(response)?{title:'Um descuido',body:'Hoje meu descuido feriu outra pessoa. Não foi minha intenção, mas a consequência foi real.'}:null;
  if(t==='theft'){
    if(outcome==='success'||theftSucceeded(response))return {title:'Aquilo que não era meu',body:'Hoje tomei para mim algo que pertencia a outro. A escolha foi minha e agora carrego também suas consequências.'};
    if(outcome==='failure')return {title:'Mãos vazias',body:'Hoje tentei furtar algo que não me pertencia, mas falhei. A intenção existiu; o objeto não veio comigo.'};
    return null;
  }
  if(t==='aid'){
    if(aidConfirmed(response)||outcome==='success')return {title:'Reparar o dano',body:'Hoje parei para ajudar alguém ferido. Não pude apagar o que aconteceu, mas consegui prestar auxílio.'};
    if(outcome==='failure')return {title:'Tentei reparar o dano',body:'Hoje tentei ajudar alguém ferido, mas meus esforços não foram suficientes.'};
    return null;
  }
  if(t==='threat')return {title:'Uma ameaça',body:'Hoje escolhi usar o medo como instrumento. Minhas palavras também deixaram marcas.'};
  if(t==='deception')return {title:'Uma mentira',body:'Hoje escolhi esconder a verdade atrás de uma mentira. O mundo pode acreditar nela; eu sei o que fiz.'};
  return null;
}
function recordResolved(c,intent,response,outcome){
  const e=entryFor(intent,response,outcome);if(!e||!window.ValeJournal?.addEntry)return false;
  const id=`resolved-${intent.id||actionHash(intent.action)}-${outcome||'narrative'}`;
  try{return !!window.ValeJournal.addEntry(c,{id,at:new Date().toISOString(),title:e.title,body:e.body,learnings:[],illustration:null,source:'episode-resolved',eventType:intent.type})}catch(err){console.warn('Diário episódico: falha ao consolidar episódio',err);return false}
}
function install(){
  if(typeof window.askAI!=='function'){setTimeout(install,150);return}
  if(window.askAI.__vdOutcomeJournal)return;
  const previous=window.askAI;
  const wrapped=async function(action){
    const c=activeCharacter();
    const roll=isRollResult(action);
    if(!roll&&c){const d=classify(action);if(d)setPending(c,{...d,id:actionHash(action),at:new Date().toISOString()});}
    const result=await previous.apply(this,arguments);
    if(!c)return result;
    const response=latestAssistant();
    if(roll){const p=getPending(c);if(p){recordResolved(c,p,response,rollOutcome(action));setPending(c,null);}return result;}
    const p=getPending(c);if(!p)return result;
    if(asksRoll(response))return result;
    recordResolved(c,p,response,null);setPending(c,null);
    return result;
  };
  wrapped.__vdOutcomeJournal=true;window.askAI=wrapped;
}
install();
window.ValeJournalEpisodic={classify,getPending,recordResolved};
})();

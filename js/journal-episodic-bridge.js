// ValeDouro WEBIA — ponte robusta entre ações do jogador e Diário episódico
(function(){
'use strict';
if(window.__VALE_JOURNAL_EPISODIC_BRIDGE__)return;
window.__VALE_JOURNAL_EPISODIC_BRIDGE__=true;

const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
function activeCharacter(){return window.state?.characters?.[window.state?.active||0]||null}
function actionHash(s){let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function isRollResult(a){return /resultado do teste solicitado|resultado=sucesso|resultado=falha/i.test(String(a||''))}
function classify(action){
  const t=norm(action);
  if(!t||isRollResult(t))return null;
  const accidental=/\b(sem intencao|sem querer|acidentalmente|por acidente|descuidado|descuidada|involuntariamente)\b/.test(t);
  const aid=/\b(presto|prestar|aplico|aplicar|faco|fazer)\b.*\b(primeiros socorros|curativo|curativos|socorro)\b|\b(ajudo|socorro|trato|cuido|estanco)\b.*\b(ferid|sangramento|machucad)/.test(t);
  if(aid)return {type:'aid',title:'Reparar o dano',body:'Depois do que aconteceu, escolhi parar e ajudar quem estava ferido. Nem todo dano pode ser desfeito, mas pude ao menos tentar repará-lo.'};
  if(accidental&&/\b(golpeio|esfaqueio|corto|estoco|agredo|desfiro|acerto|firo|ferindo|feri|machuco)\b/.test(t))return {type:'accident',title:'Um descuido',body:'Hoje meu descuido feriu outra pessoa. Não foi minha intenção, mas a consequência ainda foi real.'};
  if(/\b(mato|executo|degolo|assassino|tiro a vida|ceifo a vida)\b/.test(t))return {type:'killing',title:'Uma vida ceifada',body:'Hoje decidi tirar uma vida. O que quer que aconteça depois começou com essa escolha.'};
  if(/\b(ataco|golpeio|esfaqueio|corto|estoco|agredo|desfiro|acerto|firo|ferindo|feri)\b/.test(t)||/sac\w*\s+(minha\s+)?espada.*(golpe|atac|cort|estoc|fer)/.test(t))return {type:'assault',title:'Sangue pela minha mão',body:'Hoje escolhi erguer minha arma contra outra pessoa. O resultado ainda poderia ser incerto, mas a decisão foi minha.'};
  if(/\b(furto|furto|roubo|roubar|assalto|assaltar|subtraio|tomo para mim)\b/.test(t))return {type:'theft',title:'Aquilo que não era meu',body:'Hoje decidi tomar para mim aquilo que pertencia a outro. O resultado veio depois; a escolha foi minha.'};
  if(/\b(ameaco|intimido|vou te matar|juro que mato)\b/.test(t))return {type:'threat',title:'Uma ameaça',body:'Hoje escolhi usar o medo como instrumento. Minhas palavras também deixam marcas.'};
  if(/\b(minto|mentira|engano|finjo que|invento que)\b/.test(t))return {type:'deception',title:'Uma mentira',body:'Hoje escolhi esconder a verdade atrás de uma mentira. O mundo pode acreditar nela; eu sei o que fiz.'};
  return null;
}
function record(action){
  const c=activeCharacter(),d=classify(action);
  if(!c||!d||!window.ValeJournal?.addEntry)return false;
  const id=`local-decision-${actionHash(action)}`;
  try{return !!window.ValeJournal.addEntry(c,{id,at:new Date().toISOString(),title:d.title,body:d.body,learnings:[],illustration:null,source:'decision-local',eventType:d.type})}catch(e){console.warn('Diário episódico: falha ao registrar ação',e);return false}
}
function install(){
  if(typeof window.askAI!=='function'){setTimeout(install,150);return}
  if(window.askAI.__vdEpisodicJournal)return;
  const previous=window.askAI;
  const wrapped=async function(action){record(action);return previous.apply(this,arguments)};
  wrapped.__vdEpisodicJournal=true;
  window.askAI=wrapped;
}
install();
window.ValeJournalEpisodic={record,classify};
})();

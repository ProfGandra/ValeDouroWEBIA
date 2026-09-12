// ValeDouro WEBIA — reputação, relações, situação legal e consequências persistentes
(function(){
'use strict';

const KEY='valedouro.reputation.v1';
const DEFAULT_FACTIONS=['Liceu de Artífices','Sentinelas','Guarda de ValeDouro','População de ValeDouro','Marinha Real','São Telmo','GranBerg'];
const LABELS=[
  {min:-60,label:'Hostil'},
  {min:-30,label:'Malvisto'},
  {min:-10,label:'Desconfiado'},
  {min:10,label:'Desconhecido'},
  {min:30,label:'Conhecido'},
  {min:55,label:'Confiável'},
  {min:80,label:'Respeitado'},
  {min:Infinity,label:'Honrado'}
];

const key=c=>`${c?.name||'sem-nome'}|${c?.cls||''}`;
function readAll(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function writeAll(db){localStorage.setItem(KEY,JSON.stringify(db));window.dispatchEvent(new CustomEvent('valedouro:reputation-change'))}
function blankState(){const factions={};DEFAULT_FACTIONS.forEach(f=>factions[f]=0);return {version:1,factions,relations:{},legal:{},decisions:[],updatedAt:null}}
function stateFor(c){const db=readAll(),k=key(c);if(!db[k])db[k]=blankState();const s=db[k];s.factions=s.factions||{};DEFAULT_FACTIONS.forEach(f=>{if(typeof s.factions[f]!=='number')s.factions[f]=0});s.relations=s.relations||{};s.legal=s.legal||{};s.decisions=Array.isArray(s.decisions)?s.decisions:[];return s}
function saveFor(c,s){const db=readAll();s.updatedAt=new Date().toISOString();db[key(c)]=s;writeAll(db);return s}
function clamp(v){return Math.max(-100,Math.min(100,Number(v)||0))}
function reputationLabel(v){v=Number(v)||0;for(const x of LABELS){if(v<x.min)return x.label}return 'Honrado'}
function activeCharacter(){return window.state?.characters?.[window.state?.active||0]||null}

function changeFaction(c,faction,delta,reason=''){if(!c||!faction)return null;const s=stateFor(c);s.factions[faction]=clamp((s.factions[faction]||0)+Number(delta||0));s.decisions.unshift({at:new Date().toISOString(),kind:'faction-change',faction,delta:Number(delta||0),reason});s.decisions=s.decisions.slice(0,500);saveFor(c,s);return s.factions[faction]}
function changeRelation(c,npc,delta,reason=''){if(!c||!npc)return null;const s=stateFor(c);s.relations[npc]=clamp((s.relations[npc]||0)+Number(delta||0));s.decisions.unshift({at:new Date().toISOString(),kind:'relation-change',npc,delta:Number(delta||0),reason});s.decisions=s.decisions.slice(0,500);saveFor(c,s);return s.relations[npc]}
function setLegal(c,jurisdiction,data){if(!c||!jurisdiction)return null;const s=stateFor(c);s.legal[jurisdiction]={status:'Sem ocorrências',crimeKnown:false,identified:false,severity:0,...(s.legal[jurisdiction]||{}),...(data||{})};saveFor(c,s);return s.legal[jurisdiction]}

function defaultJournalText(decision){
  if(decision.type==='killing'){
    if(decision.targetRole==='sentinela')return {title:'Uma vida ceifada',body:'Hoje, ceifei a vida de um Sentinela. Ele guardava as fronteiras de ValeDouro. Agora, aqueles que vestem suas cores terão motivos para lembrar de mim.'};
    return {title:'Uma vida ceifada',body:'Hoje, ceifei a vida de outrem. Não há como desfazer o que fiz. O caminho continua, mas já não é o mesmo.'};
  }
  if(decision.type==='theft')return {title:'Aquilo que não era meu',body:'Hoje, tomei para mim aquilo que pertencia a outro. Talvez ninguém tenha visto. Isso não torna o ato menos verdadeiro.'};
  if(decision.type==='aid')return {title:'Uma escolha',body:'Hoje, arrisquei-me por alguém que precisava de ajuda. Talvez o mundo nunca saiba. Eu saberei.'};
  return null;
}

function addJournalDecision(c,decision){
  if(!window.ValeJournal?.addEntry)return false;
  const j=decision.journal===false?null:(decision.journal||defaultJournalText(decision));
  if(!j)return false;
  return window.ValeJournal.addEntry(c,{id:decision.id?`decision-${decision.id}`:`decision-${Date.now()}`,at:decision.at||new Date().toISOString(),title:j.title||'Decisão',body:j.body||'',learnings:Array.isArray(j.learnings)?j.learnings:[],illustration:j.illustration||null,source:'decision'});
}

function recordDecision(c,decision={}){
  if(!c)return {ok:false,reason:'no-character'};
  if(decision.source==='roll'||decision.basedOnRoll===true)return {ok:false,reason:'rolls-do-not-change-reputation'};
  const s=stateFor(c),at=decision.at||new Date().toISOString();
  const d={id:decision.id||`dec-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,at,type:decision.type||'decision',description:decision.description||'',deliberate:decision.deliberate!==false,witnessed:!!decision.witnessed,known:!!decision.known,...decision};
  s.decisions.unshift(d);s.decisions=s.decisions.slice(0,500);
  for(const [faction,delta] of Object.entries(decision.factionChanges||{}))s.factions[faction]=clamp((s.factions[faction]||0)+Number(delta||0));
  for(const [npc,delta] of Object.entries(decision.relationChanges||{}))s.relations[npc]=clamp((s.relations[npc]||0)+Number(delta||0));
  if(decision.legal&&decision.legal.jurisdiction){const j=decision.legal.jurisdiction;s.legal[j]={status:'Sem ocorrências',crimeKnown:false,identified:false,severity:0,...(s.legal[j]||{}),...decision.legal};delete s.legal[j].jurisdiction}
  saveFor(c,s);
  addJournalDecision(c,d);
  return {ok:true,state:s,decision:d};
}

function publicState(){return (window.state?.characters||[]).map(c=>{const s=stateFor(c);return {character:c.name,factions:Object.fromEntries(Object.entries(s.factions).map(([f,v])=>[f,{value:v,label:reputationLabel(v)}])),relations:Object.fromEntries(Object.entries(s.relations).map(([n,v])=>[n,{value:v,label:reputationLabel(v)}])),legal:s.legal,recentDecisions:s.decisions.slice(0,20)}})}

// Integra o estado ao Mestre e aceita marcadores de consequência produzidos pela camada narrativa.
const previousFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  if((typeof AI_ENDPOINT!=='undefined'&&url===AI_ENDPOINT)&&init?.method==='POST'&&init.body){
    try{const b=JSON.parse(init.body);b.state={...(b.state||{}),reputation:publicState()};init={...init,body:JSON.stringify(b)}}catch(e){console.warn('Reputação: estado não injetado',e)}
  }
  const res=await previousFetch(input,init);
  try{
    const data=await res.clone().json();
    if(typeof data?.text==='string'&&data.text.includes('[[REPUTATION:')){
      let changed=false;
      data.text=data.text.replace(/\s*\[\[REPUTATION:([^\]]+)\]\]\s*/gi,(_,payload)=>{
        try{const d=JSON.parse(decodeURIComponent(payload));const c=window.state?.characters?.[Number.isInteger(d.characterIndex)?d.characterIndex:(window.state?.active||0)];if(c&&recordDecision(c,d).ok)changed=true}catch(err){console.warn('Reputação: marcador inválido',err)}
        return ' ';
      });
      if(changed){data.text=data.text.trim();const headers=new Headers(res.headers);headers.set('Content-Type','application/json; charset=utf-8');return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers})}
    }
  }catch{}
  return res;
};

window.ValeReputation={stateFor,recordDecision,changeFaction,changeRelation,setLegal,reputationLabel,publicState};
window.addEventListener('DOMContentLoaded',()=>{(window.state?.characters||[]).forEach(stateFor)});
if(document.readyState!=='loading')(window.state?.characters||[]).forEach(stateFor);
})();

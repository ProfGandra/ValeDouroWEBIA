(()=>{
'use strict';
const KEY='valedouro.campaign.v1';
const DEFAULT={version:1,currentQuestId:'QST-001',completedQuestIds:[],persistentEffects:[],knownNpcs:[],startedAt:null,updatedAt:null,season2Complete:false};
function read(){try{return {...DEFAULT,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...DEFAULT}}}
function write(c){c.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(c));return c}
function campaign(){return read()}
async function index(){const r=await fetch('data/quests-index.json',{cache:'no-store'});if(!r.ok)throw new Error('Índice de quests indisponível');return r.json()}
async function quest(id){const r=await fetch(`data/quests/${id}/quest.json`,{cache:'no-store'});if(!r.ok)throw new Error(`Quest ${id} indisponível`);return r.json()}
async function loadCurrent(){let c=campaign();if(!c.startedAt){c.startedAt=new Date().toISOString();write(c)}const idx=await index();let item=idx.find(x=>x.id===c.currentQuestId);if(!item){item=idx.find(x=>!c.completedQuestIds.includes(x.id))||idx[0];c.currentQuestId=item?.id||null;write(c)}state.hiddenQuest=item?await quest(item.id):null;state.campaign=c;return state.hiddenQuest}
function uniq(a){return [...new Set((a||[]).filter(Boolean))]}
async function completeCurrent(){const c=campaign(),id=c.currentQuestId;if(!id||c.completedQuestIds.includes(id))return c;const q=state.hiddenQuest||await quest(id);c.completedQuestIds=uniq([...c.completedQuestIds,id]);c.persistentEffects=uniq([...c.persistentEffects,...(q.persistent_effects||[])]);c.knownNpcs=uniq([...c.knownNpcs,...(q.canonical_npcs||[])]);const idx=await index(),pos=idx.findIndex(x=>x.id===id),next=pos>=0?idx[pos+1]:null;c.currentQuestId=next?.id||null;if(id==='QST-020')c.season2Complete=true;write(c);state.campaign=c;state.hiddenQuest=next?await quest(next.id):null;window.dispatchEvent(new CustomEvent('valedouro:quest-complete',{detail:{completed:id,next:c.currentQuestId}}));return c}
function publicCampaignState(){const c=campaign();return {currentQuestId:c.currentQuestId,completedQuestIds:c.completedQuestIds,persistentEffects:c.persistentEffects,knownNpcs:c.knownNpcs,season2Complete:c.season2Complete}}
window.ValeDouroCampaign={read:campaign,loadCurrent,completeCurrent,publicState:publicCampaignState,reset(){localStorage.removeItem(KEY)}};

// Substitui o seletor provisório por progressão real e persistente.
window.loadHiddenQuest=loadCurrent;

// Injeta o estado persistente no payload enviado ao Mestre sem expô-lo ao jogador.
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
 const url=typeof input==='string'?input:(input?.url||'');
 if(url===AI_ENDPOINT&&init?.method==='POST'&&init.body){
  try{const b=JSON.parse(init.body);b.state={...(b.state||{}),campaign:publicCampaignState()};init={...init,body:JSON.stringify(b)}}catch(e){console.warn('Estado de campanha não injetado',e)}
  const res=await nativeFetch(input,init);
  try{
   const data=await res.clone().json();
   if(typeof data?.text==='string'&&data.text.includes('[[QUEST_COMPLETE]]')){
    await completeCurrent();
    data.text=data.text.replace(/\s*\[\[QUEST_COMPLETE\]\]\s*/g,'').trim();
    const headers=new Headers(res.headers);headers.set('Content-Type','application/json; charset=utf-8');
    return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers});
   }
  }catch(e){console.warn('Resposta do Mestre não pôde ser inspecionada',e)}
  return res;
 }
 return nativeFetch(input,init);
};

// Carrega a campanha ao abrir/continuar uma sessão. O próximo gancho permanece narrativo e invisível.
const originalStart=window.startAdventure;
if(typeof originalStart==='function')window.startAdventure=async function(){await loadCurrent();return originalStart.apply(this,arguments)};
const originalResume=window.resumeGame;
if(typeof originalResume==='function')window.resumeGame=async function(){await loadCurrent();return originalResume.apply(this,arguments)};
})();

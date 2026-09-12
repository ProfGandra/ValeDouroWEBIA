(()=>{
'use strict';
const KEY='valedouro.session.v1';
const RUN_KEY='valedouro.run.v1';
const JOURNAL_KEY='valedouro.journal.v1';
const SCENE_KEY='valedouro.scene-state.v1';
let saveTimer=null;
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return x&&typeof x==='object'?x:null}catch{return null}}
function uid(){return crypto?.randomUUID?.()||`run-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}
function currentRunId(){return localStorage.getItem(RUN_KEY)||read()?.runId||null}
function setRunId(id){if(id)localStorage.setItem(RUN_KEY,String(id));else localStorage.removeItem(RUN_KEY)}
function charKey(c){return `${c?.name||'sem-nome'}|${c?.cls||''}`}
function serializableCharacters(){try{return JSON.parse(JSON.stringify(state.characters||[]))}catch{return []}}
function storySnapshot(){const host=document.getElementById('story');if(!host)return[];return [...host.children].filter(n=>!(/pensando/i.test(n.textContent||'')&&n.classList.contains('master'))).map(n=>({className:n.className,html:n.innerHTML}))}
function resetRunScopedCharacterState(chars){
  const now=new Date().toISOString();
  try{
    const journals=JSON.parse(localStorage.getItem(JOURNAL_KEY)||'{}')||{};
    let changed=false;
    (chars||[]).forEach(c=>{
      const k=charKey(c),j=journals[k];
      if(!j)return;
      journals[k]={...j,version:Math.max(1,Number(j.version)||1),startedAt:now,entries:[],seenEntryIds:[],updatedAt:now};
      changed=true;
    });
    if(changed)localStorage.setItem(JOURNAL_KEY,JSON.stringify(journals));
  }catch(e){console.warn('Nova partida: não foi possível reiniciar o Diário',e)}
  try{
    const scenes=JSON.parse(localStorage.getItem(SCENE_KEY)||'{}')||{};
    let changed=false;
    (chars||[]).forEach(c=>{const k=charKey(c);if(k in scenes){delete scenes[k];changed=true}});
    if(changed)localStorage.setItem(SCENE_KEY,JSON.stringify(scenes));
  }catch(e){console.warn('Nova partida: não foi possível reiniciar a continuidade de cena',e)}
  try{window.dispatchEvent(new CustomEvent('valedouro:journal-change'))}catch{}
}
function saveNow(){if(!window.state||!(state.characters||[]).length)return false;const game=document.getElementById('game');const runId=currentRunId()||uid();setRunId(runId);const payload={version:2,runId,updatedAt:new Date().toISOString(),characters:serializableCharacters(),active:Number(state.active)||0,history:Array.isArray(state.history)?state.history.slice(-120):[],pendingCheck:state.pendingCheck?JSON.parse(JSON.stringify(state.pendingCheck)):null,story:storySnapshot(),campaignId:window.ValeDouroCampaign?.read?.()?.currentQuestId||null};localStorage.setItem(KEY,JSON.stringify(payload));return true}
function queueSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveNow,180)}
function restoreStory(entries){const host=document.getElementById('story');if(!host)return;host.innerHTML='';(entries||[]).forEach(e=>{const d=document.createElement('div');d.className=e.className||'entry';d.innerHTML=e.html||'';host.appendChild(d)});host.scrollTop=host.scrollHeight}
async function restore(){const s=read();if(!s?.characters?.length)return false;setRunId(s.runId||currentRunId()||uid());state.characters=JSON.parse(JSON.stringify(s.characters));state.active=Math.max(0,Math.min(Number(s.active)||0,state.characters.length-1));state.history=Array.isArray(s.history)?s.history:[];state.pendingCheck=s.pendingCheck||null;try{await window.ValeDouroCampaign?.loadCurrent?.()}catch(e){console.warn('Campanha não pôde ser restaurada',e)}renderParty();selectPC(state.active);restoreStory(s.story);show('game');const rb=document.getElementById('rollbox');if(state.pendingCheck){const r=state.pendingCheck,p=state.characters[r.playerIndex??state.active];if(rb)rb.classList.add('active');const rt=document.getElementById('rollText');if(rt&&p)rt.innerHTML=`<strong>${esc(p.name)}</strong>: teste de ${labels[r.attr]||r.attr} (${r.attr}), CD ${r.cd}<br><span class="muted">${esc(r.motivo||'')}</span>`;const die=document.getElementById('die');if(die)die.textContent='d20';const rr=document.getElementById('rollResult');if(rr)rr.innerHTML='';const btn=document.getElementById('rollBtn');if(btn)btn.disabled=false}else if(rb)rb.classList.remove('active');const actBtn=document.getElementById('actBtn');if(actBtn)actBtn.disabled=!!state.pendingCheck;return true}
const previousResume=window.resumeGame;
window.resumeGame=async function(){if(await restore())return;return previousResume?.apply(this,arguments)};
const previousStart=window.startAdventure;
window.startAdventure=async function(){
  localStorage.removeItem(KEY);
  const runId=uid();
  setRunId(runId);
  resetRunScopedCharacterState(state.characters||[]);
  const r=await previousStart?.apply(this,arguments);
  try{window.ValeRangerJournal?.reconcile?.()}catch{}
  queueSave();
  return r;
};
['act','askAI','rollCheck'].forEach(name=>{const fn=window[name];if(typeof fn==='function')window[name]=async function(){try{return await fn.apply(this,arguments)}finally{queueSave()}}});
const oldSelect=window.selectPC;if(typeof oldSelect==='function')window.selectPC=function(){const r=oldSelect.apply(this,arguments);queueSave();return r};
document.addEventListener('DOMContentLoaded',()=>{const host=document.getElementById('story');if(host)new MutationObserver(queueSave).observe(host,{childList:true,subtree:true,characterData:true});});
window.addEventListener('pagehide',saveNow);window.addEventListener('beforeunload',saveNow);window.ValeSession={read,save:saveNow,restore,currentRunId,clear(){localStorage.removeItem(KEY);localStorage.removeItem(RUN_KEY)}};
})();

// ValeDouro WEBIA — Save completo de aventura (local + nuvem via ValeCloud)
(function(){
'use strict';
if(window.__VALE_GAME_SAVE__)return;
window.__VALE_GAME_SAVE__=true;

const SAVE_PREFIX='valedouro.game.save.';
const ACTIVE_KEY='valedouro.game.active.v1';
const MAX_SAVES=12;
let saveTimer=null,restoring=false;

const uid=()=>crypto?.randomUUID?.()||`game-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
const clone=x=>{try{return JSON.parse(JSON.stringify(x))}catch{return null}};
function activeGameId(){return localStorage.getItem(ACTIVE_KEY)||null}
function setActiveGameId(id){if(id)localStorage.setItem(ACTIVE_KEY,String(id));else localStorage.removeItem(ACTIVE_KEY)}
function saveKey(id){return SAVE_PREFIX+id}
function isSaveScopedKey(k){
  if(!k?.startsWith('valedouro.'))return false;
  if(k.startsWith('valedouro.cloud.'))return false;
  if(k.startsWith(SAVE_PREFIX))return false;
  if(k===ACTIVE_KEY||k==='valedouro.characters'||k==='valedouro.session.v1'||k==='valedouro.run.v1')return false;
  return true;
}
function captureStorage(){const out={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(isSaveScopedKey(k))out[k]=localStorage.getItem(k)}return out}
function restoreStorage(snapshot){
  const keep=new Set(Object.keys(snapshot||{}));
  const current=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(isSaveScopedKey(k))current.push(k)}
  current.forEach(k=>{if(!keep.has(k))localStorage.removeItem(k)});
  Object.entries(snapshot||{}).forEach(([k,v])=>{if(isSaveScopedKey(k)&&v!=null)localStorage.setItem(k,String(v))});
}
function storySnapshot(){const host=document.getElementById('story');if(!host)return[];return [...host.children].filter(n=>!(/pensando/i.test(n.textContent||'')&&n.classList.contains('master'))).map(n=>({className:n.className,html:n.innerHTML}))}
function restoreStory(entries){const host=document.getElementById('story');if(!host)return;host.innerHTML='';(entries||[]).forEach(e=>{const d=document.createElement('div');d.className=e.className||'entry';d.innerHTML=e.html||'';host.appendChild(d)});host.scrollTop=host.scrollHeight}
function questId(){return window.state?.campaign?.currentQuestId||window.state?.hiddenQuest?.id||window.ValeDouroCampaign?.read?.()?.currentQuestId||null}
function partyLabel(chars){const names=(chars||[]).map(c=>c?.name).filter(Boolean);return names.length?names.join(', '):'Aventura sem nome'}
function makeSnapshot(id,reason='autosave'){
  const chars=clone(window.state?.characters||[])||[];
  return {
    version:1,gameId:id,updatedAt:new Date().toISOString(),reason,
    title:partyLabel(chars),questId:questId(),
    state:{characters:chars,active:Number(window.state?.active)||0,history:clone(window.state?.history||[])||[],pendingCheck:clone(window.state?.pendingCheck)||null},
    story:storySnapshot(),storage:captureStorage()
  }
}
function saveNow(reason='autosave',{sync=false}={}){
  if(restoring||!window.state||(window.state.characters||[]).length===0)return false;
  let id=activeGameId();if(!id){id=uid();setActiveGameId(id)}
  const snapshot=makeSnapshot(id,reason);localStorage.setItem(saveKey(id),JSON.stringify(snapshot));
  pruneOldSaves();
  if(sync&&window.ValeCloud?.user)window.ValeCloud.syncNow?.();
  renderSaveStatus('Salvo');
  return snapshot;
}
function queueSave(reason='autosave'){if(restoring)return;clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveNow(reason),350)}
function parseSave(raw){try{const x=JSON.parse(raw||'null');return x&&x.gameId?x:null}catch{return null}}
function listSaves(){const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k?.startsWith(SAVE_PREFIX))continue;const s=parseSave(localStorage.getItem(k));if(s)out.push(s)}return out.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))}
function pruneOldSaves(){const saves=listSaves();saves.slice(MAX_SAVES).forEach(s=>localStorage.removeItem(saveKey(s.gameId)))}
async function loadQuest(id){if(!id)return null;try{const r=await fetch(`data/quests/${id}/quest.json`,{cache:'no-store'});return r.ok?await r.json():null}catch{return null}}
async function restore(id){
  const s=parseSave(localStorage.getItem(saveKey(id)));if(!s)return false;
  restoring=true;
  try{
    restoreStorage(s.storage||{});setActiveGameId(s.gameId);
    state.characters=clone(s.state?.characters||[])||[];state.active=Math.max(0,Math.min(Number(s.state?.active)||0,Math.max(0,state.characters.length-1)));state.history=clone(s.state?.history||[])||[];state.pendingCheck=clone(s.state?.pendingCheck)||null;
    state.hiddenQuest=await loadQuest(s.questId)||state.hiddenQuest||null;
    try{state.campaign=window.ValeDouroCampaign?.read?.()||state.campaign||null}catch{}
    renderParty();selectPC(state.active);restoreStory(s.story);show('game');
    const rb=document.getElementById('rollbox');if(state.pendingCheck){const r=state.pendingCheck,p=state.characters[r.playerIndex??state.active];rb?.classList.add('active');const rt=document.getElementById('rollText');if(rt&&p)rt.innerHTML=`<strong>${esc(p.name)}</strong>: teste de ${labels[r.attr]||r.attr} (${r.attr}), CD ${r.cd}<br><span class="muted">${esc(r.motivo||'')}</span>`;const die=document.getElementById('die');if(die)die.textContent='d20';const rr=document.getElementById('rollResult');if(rr)rr.innerHTML='';const btn=document.getElementById('rollBtn');if(btn)btn.disabled=false}else rb?.classList.remove('active');
    const actBtn=document.getElementById('actBtn');if(actBtn)actBtn.disabled=!!state.pendingCheck;
    try{window.ValeEconomy?.renderHud?.()}catch{} try{window.ValeRangerJournal?.reconcile?.()}catch{}
    renderSaveStatus('Aventura restaurada');
    return true;
  }finally{restoring=false}
}
function deleteSave(id){if(!id)return;localStorage.removeItem(saveKey(id));if(activeGameId()===id)setActiveGameId(null);openLoadDialog()}
function newGameIdentity(){const id=uid();setActiveGameId(id);return id}
function fmtDate(iso){try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso))}catch{return iso||''}}
function ensureModal(){let modal=document.getElementById('gameSaveModal');if(modal)return modal;modal=document.createElement('div');modal.id='gameSaveModal';modal.className='modal';modal.innerHTML=`<div class="panel sheet" style="max-width:760px"><div class="row" style="justify-content:space-between"><h2>Aventuras salvas</h2><button class="btn" id="gameSaveClose">Fechar</button></div><p class="muted">Cada aventura é independente da ficha do personagem. Saves também são sincronizados com sua conta Google quando conectada.</p><div id="gameSaveList"></div></div>`;document.body.appendChild(modal);modal.querySelector('#gameSaveClose').onclick=()=>modal.classList.remove('active');return modal}
function openLoadDialog(){const modal=ensureModal(),box=modal.querySelector('#gameSaveList'),saves=listSaves();box.innerHTML=saves.length?saves.map(s=>`<div class="char-card" style="margin:10px 0"><div class="row" style="justify-content:space-between;gap:12px"><div><strong>${esc(s.title||'Aventura')}</strong><div class="muted">${esc(s.questId||'Quest não identificada')} • ${esc(fmtDate(s.updatedAt))}</div></div><div class="row"><button class="btn primary" data-load="${esc(s.gameId)}">Continuar</button><button class="btn" data-del="${esc(s.gameId)}">Excluir</button></div></div></div>`).join(''):'<p class="muted">Nenhuma aventura salva encontrada neste dispositivo/conta.</p>';box.querySelectorAll('[data-load]').forEach(b=>b.onclick=async()=>{modal.classList.remove('active');await restore(b.dataset.load)});box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(confirm('Excluir este save de aventura?'))deleteSave(b.dataset.del)});modal.classList.add('active')}
function renderSaveStatus(text){let e=document.getElementById('valeSaveStatus');if(!e){const top=document.querySelector('#game .topbar .row:last-child');if(!top)return;e=document.createElement('span');e.id='valeSaveStatus';e.className='muted';e.style.fontSize='11px';top.prepend(e)}e.textContent=text?`💾 ${text}`:'';if(text)setTimeout(()=>{if(e.textContent===`💾 ${text}`)e.textContent=''},2200)}
function installUI(){
  const ng=document.getElementById('newgame');if(ng){const old=[...ng.querySelectorAll('button')].find(b=>/Continuar com personagem salvo/i.test(b.textContent||''));if(old){old.textContent='Continuar aventura salva';old.onclick=openLoadDialog}}
  const top=document.querySelector('#game .topbar .row:last-child');if(top&&!document.getElementById('manualSaveBtn')){const b=document.createElement('button');b.id='manualSaveBtn';b.className='btn small';b.textContent='Salvar';b.onclick=()=>saveNow('manual',{sync:true});top.prepend(b)}
}
function installHooks(){
  if(typeof window.startAdventure==='function'&&!window.startAdventure.__vdGameSave){const prev=window.startAdventure;const w=async function(){newGameIdentity();const r=await prev.apply(this,arguments);saveNow('new-game');return r};w.__vdGameSave=true;window.startAdventure=w}
  window.resumeGame=openLoadDialog;
  ['act','askAI','rollCheck'].forEach(name=>{const fn=window[name];if(typeof fn==='function'&&!fn.__vdGameSave){const w=async function(){try{return await fn.apply(this,arguments)}finally{queueSave(name)}};w.__vdGameSave=true;window[name]=w}});
}
['valedouro:inventory-change','valedouro:journal-change'].forEach(evt=>window.addEventListener(evt,()=>queueSave(evt)));
window.addEventListener('pagehide',()=>saveNow('pagehide'));window.addEventListener('beforeunload',()=>saveNow('beforeunload'));
document.addEventListener('DOMContentLoaded',()=>{installUI();installHooks()});
setTimeout(()=>{installUI();installHooks()},0);setInterval(installUI,2000);
window.ValeGameSave={save:saveNow,queue:queueSave,restore,list:listSaves,open:openLoadDialog,newGameIdentity,activeGameId};
})();

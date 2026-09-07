// ValeDouro WEBIA — Diário de Jornada / Quest Tracker
(function(){
  'use strict';

  const DATA_URL='data/quest-tracker.json?v=20260907-1';
  const TRACKER_KEY='valedouro.quest-tracker.v1';
  let trackerData=null;
  let lastQuestId=Symbol('unset');

  function readLocal(){
    try{return JSON.parse(localStorage.getItem(TRACKER_KEY)||'{}')}catch{return {}}
  }
  function writeLocal(data){
    localStorage.setItem(TRACKER_KEY,JSON.stringify(data||{}));
  }
  function campaign(){
    try{return window.ValeDouroCampaign?.read?.()||null}catch{return null}
  }
  function activeId(){
    const c=campaign();
    return c?.currentQuestId||null;
  }
  async function loadData(){
    if(trackerData)return trackerData;
    try{
      const r=await fetch(DATA_URL,{cache:'no-store'});
      if(!r.ok)throw new Error('tracker indisponível');
      trackerData=await r.json();
    }catch(e){
      console.warn('Diário de Jornada indisponível',e);
      trackerData={default_free_roam:{title:'Mundo Livre',objective:'Explore ValeDouro e os locais já conhecidos no seu próprio ritmo.'},quests:{}};
    }
    return trackerData;
  }

  function injectStyles(){
    if(document.getElementById('valeQuestTrackerStyles'))return;
    const style=document.createElement('style');
    style.id='valeQuestTrackerStyles';
    style.textContent=`
      .journey-tracker{margin:14px 0 16px;padding:13px 14px;border:1px solid rgba(201,164,92,.38);border-radius:12px;background:linear-gradient(180deg,rgba(54,40,24,.72),rgba(24,18,13,.86));box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
      .journey-tracker .journey-kicker{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#c8a55f;font-weight:800;margin-bottom:8px}
      .journey-tracker .journey-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9f927f;margin-top:7px}
      .journey-tracker .journey-title{font-family:Georgia,'Times New Roman',serif;color:#f0d79b;font-weight:700;font-size:16px;line-height:1.25;margin-top:2px}
      .journey-tracker .journey-objective{font-size:12px;line-height:1.45;color:#ded1bd;margin-top:3px}
      .journey-tracker .journey-free{color:#bfc8b5}
      @media(max-width:900px){.journey-tracker{margin:10px 0;padding:11px 12px}.journey-tracker .journey-title{font-size:15px}}
      @media print{.journey-tracker{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function ensurePanel(){
    const aside=document.querySelector('#game .gamegrid aside');
    if(!aside)return null;
    let panel=document.getElementById('journeyTracker');
    if(panel)return panel;
    panel=document.createElement('section');
    panel.id='journeyTracker';
    panel.className='journey-tracker';
    panel.setAttribute('aria-live','polite');
    const visual=document.getElementById('sceneVisual');
    if(visual&&visual.parentNode===aside) visual.insertAdjacentElement('afterend',panel);
    else aside.appendChild(panel);
    return panel;
  }

  function resolvedEntry(id){
    const local=readLocal();
    const dynamic=id&&local[id]?local[id]:null;
    const base=id?trackerData?.quests?.[id]:null;
    if(id)return {
      title: dynamic?.title||base?.title||id,
      objective: dynamic?.objective||base?.objective||'Continue investigando e siga as pistas disponíveis.'
    };
    return trackerData?.default_free_roam||{title:'Mundo Livre',objective:'Explore ValeDouro e os locais já conhecidos no seu próprio ritmo.'};
  }

  async function render(force=false){
    await loadData();
    const id=activeId();
    if(!force&&id===lastQuestId)return;
    lastQuestId=id;
    const panel=ensurePanel();
    if(!panel)return;
    const entry=resolvedEntry(id);
    panel.innerHTML=`<div class="journey-kicker">Jornada</div><div class="journey-label">${id?'Missão ativa':'Estado atual'}</div><div class="journey-title${id?'':' journey-free'}">${escapeHtml(entry.title)}</div><div class="journey-label">${id?'Objetivo principal':'Orientação'}</div><div class="journey-objective">${escapeHtml(entry.objective)}</div>`;
  }

  function escapeHtml(s){
    return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function setObjective(questId,objective,title){
    if(!questId||!objective)return;
    const local=readLocal();
    local[questId]={...(local[questId]||{}),objective:String(objective)};
    if(title)local[questId].title=String(title);
    writeLocal(local);
    if(activeId()===questId)render(true);
  }
  function clearObjective(questId){
    const local=readLocal();
    if(questId&&local[questId]){delete local[questId];writeLocal(local);render(true)}
  }

  window.ValeQuestTracker={render,setObjective,clearObjective,current(){const id=activeId();return {questId:id,...resolvedEntry(id)}}};

  injectStyles();
  window.addEventListener('valedouro:quest-complete',()=>setTimeout(()=>render(true),0));
  window.addEventListener('storage',e=>{if(e.key===TRACKER_KEY||e.key==='valedouro.campaign.v1')render(true)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render(true)});

  if(typeof window.show==='function'){
    const previousShow=window.show;
    window.show=function(id){
      const result=previousShow.apply(this,arguments);
      if(id==='game')setTimeout(()=>render(true),0);
      return result;
    };
  }

  render(true);
  setInterval(()=>{
    const game=document.getElementById('game');
    if(game?.classList.contains('active'))render(false);
  },900);
})();

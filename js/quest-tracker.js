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
      .journey-modal-card{width:min(620px,92vw);max-height:82vh;overflow:auto}
      .journey-modal-body{padding-top:6px}
      .journey-kicker{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#c8a55f;font-weight:800;margin-bottom:10px}
      .journey-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9f927f;margin-top:10px}
      .journey-title{font-family:Georgia,'Times New Roman',serif;color:#f0d79b;font-weight:700;font-size:21px;line-height:1.3;margin-top:4px}
      .journey-objective{font-size:14px;line-height:1.55;color:#ded1bd;margin-top:5px}
      .journey-free{color:#bfc8b5}
      @media(max-width:700px){.journey-title{font-size:18px}.journey-objective{font-size:13px}}
      @media print{#journeyModal,#journeyTopBtn{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  function ensureButton(){
    if(document.getElementById('journeyTopBtn'))return;
    const game=document.getElementById('game');
    if(!game)return;
    const inventoryBtn=[...game.querySelectorAll('.topbar .row .btn')].find(b=>/invent[aá]rio/i.test(b.textContent||''));
    if(!inventoryBtn)return;
    const btn=document.createElement('button');
    btn.id='journeyTopBtn';
    btn.type='button';
    btn.className='btn small';
    btn.textContent='Jornada';
    btn.addEventListener('click',openJourney);
    inventoryBtn.insertAdjacentElement('beforebegin',btn);
  }

  function ensureModal(){
    let modal=document.getElementById('journeyModal');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='journeyModal';
    modal.className='modal';
    modal.innerHTML=`<div class="panel sheet journey-modal-card"><div class="row" style="justify-content:space-between"><h2>Diário de Jornada</h2><button class="btn" type="button" id="journeyCloseBtn">Fechar</button></div><div id="journeyModalContent" class="journey-modal-body" aria-live="polite"></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('#journeyCloseBtn')?.addEventListener('click',closeJourney);
    modal.addEventListener('click',e=>{if(e.target===modal)closeJourney()});
    return modal;
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

  function escapeHtml(s){
    return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  async function render(force=false){
    await loadData();
    ensureButton();
    ensureModal();
    const id=activeId();
    if(!force&&id===lastQuestId)return;
    lastQuestId=id;
    const content=document.getElementById('journeyModalContent');
    if(!content)return;
    const entry=resolvedEntry(id);
    content.innerHTML=`<div class="journey-kicker">Jornada</div><div class="journey-label">${id?'Missão ativa':'Estado atual'}</div><div class="journey-title${id?'':' journey-free'}">${escapeHtml(entry.title)}</div><div class="journey-label">${id?'Objetivo principal':'Orientação'}</div><div class="journey-objective">${escapeHtml(entry.objective)}</div>`;
  }

  async function openJourney(){
    await render(true);
    ensureModal().classList.add('active');
  }
  function closeJourney(){
    document.getElementById('journeyModal')?.classList.remove('active');
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

  window.ValeQuestTracker={render,setObjective,clearObjective,open:openJourney,close:closeJourney,current(){const id=activeId();return {questId:id,...resolvedEntry(id)}}};
  window.openJourney=openJourney;
  window.closeJourney=closeJourney;

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

// Reforço de contexto do Mestre Virtual. Não altera a interface.
(function(){
  'use strict';
  if(window.__VALE_QUEST_CONTEXT_PATCH__)return;
  window.__VALE_QUEST_CONTEXT_PATCH__=true;
  const originalFetch=window.fetch.bind(window);

  function readInventory(name){
    try{
      const db=JSON.parse(localStorage.getItem('valedouro.inventory.v2')||'{}');
      const k=Object.keys(db).find(x=>x.startsWith(String(name||'')+'|'));
      const inv=k?db[k]:null;
      if(!inv)return [];
      return [...(inv.items||[]),...(inv.resources||[])]
        .filter(x=>Number(x.qty||0)>0&&!['lost','abandoned'].includes(x.state))
        .map(x=>({name:x.name,qty:Number(x.qty||0),unit:x.unit||'un',state:x.state||'available'}));
    }catch{return []}
  }

  function questRules(q){
    const guardrails=Array.isArray(q?.narrative_guardrails)?q.narrative_guardrails.map(x=>x?.text||x).filter(Boolean):[];
    const opening=q?.opening_contract||null;
    return {
      opening,
      guardrails,
      general:[
        'Não avance a posição do grupo além do que a ação do jogador implica.',
        'Não invente pistas, ameaças, rumores, bifurcações, NPCs conhecidos ou presságios sem base no conteúdo da quest, no cânone ou no histórico.',
        'Não revele verdades ocultas antes que uma fonte ou evidência plausível as exponha.',
        'Não assuma que o jogador aceitou uma missão ou iniciou viagem sem que ele demonstre essa intenção.',
        'Ao mencionar posses, use somente ficha e inventário fornecidos pelo estado do jogo.'
      ]
    };
  }

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    let patched=init;
    if(typeof AI_ENDPOINT!=='undefined'&&url===AI_ENDPOINT&&init&&init.method==='POST'&&init.body){
      try{
        const body=JSON.parse(init.body);
        const party=Array.isArray(body?.player?.party)?body.player.party:[];
        body.world={...(body.world||{}),quest_context_rules:questRules(body.quest)};
        body.player={...(body.player||{}),inventory_state:party.map(p=>({name:p.name,items:readInventory(p.name)}))};
        patched={...init,body:JSON.stringify(body)};
      }catch(e){console.warn('Quest context não aplicado',e)}
    }
    return originalFetch(input,patched);
  };
})();

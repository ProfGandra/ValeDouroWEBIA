// ValeDouro WEBIA — reforço de contexto narrativo
(function(){
  'use strict';
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

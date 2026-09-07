// ValeDouro WEBIA — endurecimento de contexto do Mestre Virtual
(function(){
  'use strict';
  if(window.__VALE_MASTER_HARDENING__) return;
  window.__VALE_MASTER_HARDENING__=true;

  const previousFetch=window.fetch.bind(window);

  function isAI(url){
    try{return typeof AI_ENDPOINT!=='undefined' && url===AI_ENDPOINT}catch{return false}
  }

  function isOpening(body){
    const history=Array.isArray(body?.history)?body.history:[];
    const action=String(body?.action||'');
    return history.length===0 && /inicie a sess[aã]o/i.test(action);
  }

  function compactInventory(name){
    try{
      const db=JSON.parse(localStorage.getItem('valedouro.inventory.v2')||'{}');
      const key=Object.keys(db).find(k=>k.startsWith(String(name||'')+'|'));
      const inv=key?db[key]:null;
      if(!inv)return [];
      return [...(inv.items||[]),...(inv.resources||[])]
        .filter(x=>Number(x.qty||0)>0&&!['lost','abandoned'].includes(x.state))
        .map(x=>({name:x.name,qty:Number(x.qty||0),unit:x.unit||'un',state:x.state||'available'}));
    }catch{return []}
  }

  function openingQuestView(q){
    if(!q)return null;
    const publicKnowledge=q?.opening_contract?.initial_public_knowledge||[];
    const guardrails=Array.isArray(q?.narrative_guardrails)
      ?q.narrative_guardrails.map(x=>x?.text||x).filter(Boolean)
      :[];
    const startLocation=Array.isArray(q?.locations)?q.locations.find(x=>x.id==='LOC-001')||q.locations[0]:null;
    return {
      id:q.id,
      identity:{title:q?.identity?.title||q?.title||q.id},
      phase:'opening',
      opening_contract:q.opening_contract||null,
      public_knowledge:publicKnowledge,
      narrative_guardrails:guardrails,
      start_location:startLocation?{id:startLocation.id,name:startLocation.name,type:startLocation.type}:null,
      hidden_truth_withheld:true
    };
  }

  function openingDirective(qid){
    if(qid==='QST-001'){
      return [
        'ABERTURA QST-001 — REGRA PRIORITÁRIA E OBRIGATÓRIA.',
        'Comece dentro de ValeDouro, em situação segura e cotidiana.',
        'A única informação pública inicial da missão é: uma pequena caravana comercial era esperada e não chegou; há preocupação e existe um último ponto de passagem registrado.',
        'NÃO diga que a caravana foi atacada, NÃO mencione bandidos, aprendiz desaparecido, falha mecânica, sequestro, floresta, trilhas alternativas ou causa do atraso.',
        'NÃO coloque o personagem já na saída da cidade ou na estrada e NÃO invente mensageiro urgente, velho mercador, guardas que o reconhecem ou rumores extras.',
        'Apresente a situação e pare para o jogador decidir livremente o que fazer.',
        'Ao citar equipamentos, use apenas os itens realmente fornecidos pelo estado do jogo.'
      ].join(' ');
    }
    return 'ABERTURA DE QUEST — permaneça no ponto inicial e apresente apenas conhecimento público já disponível, sem antecipar segredos, perigos ou deslocamentos não escolhidos pelo jogador.';
  }

  function openingLooksInvalid(text,qid){
    if(qid!=='QST-001')return false;
    const t=String(text||'').toLowerCase();
    const bad=[/bandid/,/foi atacad/,/atacada na estrada/,/aprendiz/,/sequestr/,/falha mec/,/bifurca/,/trilha.*floresta/,/mensageiro/,/desapareceu dias/];
    return bad.some(r=>r.test(t));
  }

  function responseWith(data,res){
    const headers=new Headers(res.headers);
    headers.set('Content-Type','application/json; charset=utf-8');
    return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers});
  }

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(!isAI(url)||!init||init.method!=='POST'||!init.body) return previousFetch(input,init);

    let patched=init;
    let opening=false;
    let questId=null;
    let body=null;

    try{
      body=JSON.parse(init.body);
      opening=isOpening(body);
      questId=body?.quest?.id||null;
      const party=Array.isArray(body?.player?.party)?body.player.party:[];
      body.player={...(body.player||{}),inventory_state:party.map(p=>({name:p.name,items:compactInventory(p.name)}))};
      body.world={...(body.world||{}),narrative_authority:'quest_and_persisted_state_only'};

      if(opening){
        body.quest=openingQuestView(body.quest);
        body.world={...(body.world||{}),quest_phase:'opening',opening_directive:openingDirective(questId)};
        body.action=openingDirective(questId)+' '+String(body.action||'');
      }
      patched={...init,body:JSON.stringify(body)};
    }catch(e){
      console.warn('Hardening do Mestre não aplicado',e);
    }

    let res=await previousFetch(input,patched);

    if(opening){
      try{
        const data=await res.clone().json();
        const reply=String(data?.reply||data?.text||'');
        if(openingLooksInvalid(reply,questId)){
          const retryBody={...body,action:openingDirective(questId)+' Reescreva a abertura do zero obedecendo estritamente a essas regras. Não aproveite elementos da resposta anterior.'};
          res=await previousFetch(input,{...patched,body:JSON.stringify(retryBody)});
        }
      }catch(e){console.warn('Validação da abertura não aplicada',e)}

      if(questId==='QST-001'){
        setTimeout(()=>{
          try{window.ValeSceneVisuals?.setScene?.('LOC-001','QST-001')}catch{}
        },0);
      }
    }

    return res;
  };
})();

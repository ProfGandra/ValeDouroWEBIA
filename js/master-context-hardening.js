// ValeDouro WEBIA — disciplina narrativa e transições naturais de Quest
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

  function questPublicActors(q){
    if(!Array.isArray(q?.actors)) return [];
    return q.actors.map(a=>({
      id:a.id, role:a.role, canonical:!!a.canonical, name:a.name||null,
      initial_location:a.initial_location||null,
      constraints:Array.isArray(a.constraints)?a.constraints:[]
    }));
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
      public_actors:questPublicActors(q),
      narrative_guardrails:guardrails,
      start_location:startLocation?{id:startLocation.id,name:startLocation.name,type:startLocation.type}:null,
      hidden_truth_withheld:true
    };
  }

  function openingDirective(q){
    const qid=q?.id||'';
    const title=q?.identity?.title||q?.title||qid;
    const specific=q?.opening_contract||null;
    const actorRoles=questPublicActors(q).map(a=>a.name||a.role).filter(Boolean).join(', ');

    if(qid==='QST-001'){
      return [
        'ABERTURA QST-001 — REGRA PRIORITÁRIA.',
        'Comece DENTRO de ValeDouro, antes de qualquer partida.',
        'A missão deve ser apresentada por uma pessoa presente na cena: preferencialmente o mercador responsável/interessado na caravana; alternativamente um guarda do portão que tenha recebido o aviso do atraso.',
        'Faça existir um encontro e um diálogo natural. O NPC informa somente que uma pequena caravana comercial era esperada, não chegou no horário previsto e existe preocupação suficiente para pedir que alguém verifique o ocorrido.',
        'O NPC pode explicar rota prevista, horário e último registro somente se o jogador perguntar ou se isso for necessário para aceitar a tarefa.',
        'NÃO diga que houve ataque; NÃO mencione bandidos, aprendiz, sequestro, falha mecânica, floresta suspeita, Montanhas Sombrias, rastros, bifurcações ou causa do atraso.',
        'NÃO coloque o personagem na saída, estrada ou floresta antes que ele decida partir.',
        'Depois de apresentar o pedido, PARE e pergunte o que o jogador faz. Ele pode conversar, perguntar, preparar-se, aceitar, recusar ou adiar.',
        'Não invente conteúdo de pacotes/equipamentos; use somente o inventário real fornecido pelo jogo.'
      ].join(' ');
    }

    return [
      `ABERTURA DA QUEST ${qid} — ${title}.`,
      'Toda nova Quest precisa ser percebida pelo jogador como uma continuação natural da história, e não como uma troca invisível de arquivo.',
      'Faça a transição a partir do local, consequência ou situação deixada pela Quest anterior.',
      'Introduza a nova necessidade por meio de uma PESSOA plausível presente na cena: NPC canônico quando o contexto da Quest indicar um; caso contrário, use somente um papel genérico já compatível com os atores públicos da Quest (por exemplo viajante, morador, guarda, trabalhador, sobrevivente), sem criar nome, cargo importante, passado ou relação canônica.',
      actorRoles?`Papéis públicos disponíveis nesta Quest: ${actorRoles}.`:'Não há ator público estruturado: use uma pessoa local genérica apenas para apresentar a situação observável, sem criar novo personagem canônico.',
      'Essa pessoa deve conversar com o grupo e apresentar apenas o PROBLEMA INICIAL observável ou conhecido publicamente. Não revele a causa verdadeira, solução, antagonista, pistas futuras ou segredos da Quest.',
      'A apresentação não significa aceitação automática. Depois do diálogo inicial, dê espaço para perguntas e para o jogador decidir livremente o que fazer.',
      'Não transporte o grupo para o próximo local, não inicie investigação, combate ou viagem sem uma ação do jogador.',
      specific?'Obedeça também integralmente ao opening_contract específico desta Quest.':'',
      'Use apenas equipamentos e relações realmente presentes no estado persistente.'
    ].filter(Boolean).join(' ');
  }

  function openingLooksInvalid(text,qid){
    if(qid!=='QST-001')return false;
    const t=String(text||'').toLowerCase();
    const bad=[
      /bandid/,/foi atacad/,/atacada na estrada/,/aprendiz/,/sequestr/,/falha mec/,
      /bifurca/,/trilha.*floresta/,/montanhas sombrias/,/rastros? recentes?/,/animais selvagens?/
    ];
    const missingPresenter=!/(mercador|guarda|sentinela)/i.test(t);
    return bad.some(r=>r.test(t))||missingPresenter;
  }

  function q1CorrectiveDirective(){
    return [
      'REESCREVA A ABERTURA QST-001 DO ZERO.',
      'Cena dentro de ValeDouro. Um mercador ligado à caravana OU um guarda do portão aborda/conversa naturalmente com o personagem.',
      'Ele explica somente que uma caravana comercial esperada não chegou e pede ajuda para verificar o atraso.',
      'Inclua fala direta suficiente para o jogador poder conversar com esse NPC.',
      'Não coloque o personagem na estrada. Não mencione ataque, bandidos, aprendiz, falha mecânica, Montanhas Sombrias, bifurcação, rastros ou causa do desaparecimento.',
      'Termine aguardando a decisão do jogador.'
    ].join(' ');
  }

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(!isAI(url)||!init||init.method!=='POST'||!init.body) return previousFetch(input,init);

    let patched=init, opening=false, questId=null, body=null, originalQuest=null;
    try{
      body=JSON.parse(init.body);
      opening=isOpening(body);
      originalQuest=body?.quest||null;
      questId=originalQuest?.id||null;
      const party=Array.isArray(body?.player?.party)?body.player.party:[];
      body.player={...(body.player||{}),inventory_state:party.map(p=>({name:p.name,items:compactInventory(p.name)}))};
      body.world={
        ...(body.world||{}),
        narrative_authority:'quest_and_persisted_state_only',
        quest_transition_policy:'natural_npc_presentation_required'
      };

      if(opening){
        const directive=openingDirective(originalQuest);
        body.quest=openingQuestView(originalQuest);
        body.world={
          ...(body.world||{}),
          quest_phase:'opening',
          opening_directive:directive,
          transition_rule:'A nova Quest deve começar com uma transição natural e uma pessoa plausível apresentando a necessidade inicial ao jogador. A pessoa não deve revelar segredos nem assumir que a missão foi aceita.'
        };
        body.action=directive+' '+String(body.action||'');
      }
      patched={...init,body:JSON.stringify(body)};
    }catch(e){console.warn('Disciplina narrativa do Mestre não aplicada',e)}

    let res=await previousFetch(input,patched);

    if(opening&&questId==='QST-001'){
      try{
        const data=await res.clone().json();
        const reply=String(data?.reply||data?.text||'');
        if(openingLooksInvalid(reply,questId)){
          const retryBody={...body,action:q1CorrectiveDirective()};
          res=await previousFetch(input,{...patched,body:JSON.stringify(retryBody)});
        }
      }catch(e){console.warn('Validação da abertura Q1 não aplicada',e)}
      setTimeout(()=>{try{window.ValeSceneVisuals?.setScene?.('LOC-001','QST-001')}catch{}},0);
    }

    return res;
  };
})();

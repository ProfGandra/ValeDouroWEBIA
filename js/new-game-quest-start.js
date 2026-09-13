// ValeDouro WEBIA — Nova Partida sempre inicia pela QST-001 canônica
(function(){
'use strict';
if(window.__VALE_NEW_GAME_QST001__)return;
window.__VALE_NEW_GAME_QST001__=true;

const START_QUEST='QST-001';
const CAMPAIGN_KEY='valedouro.campaign.v1';

async function loadStartQuest(){
  const r=await fetch(`data/quests/${START_QUEST}/quest.json`,{cache:'no-store'});
  if(!r.ok)throw new Error(`Quest inicial ${START_QUEST} indisponível`);
  const q=await r.json();
  if(q?.id!==START_QUEST)throw new Error('Arquivo da quest inicial inválido');
  return q;
}
function freshCampaign(){
  const now=new Date().toISOString();
  const c={version:1,currentQuestId:START_QUEST,completedQuestIds:[],persistentEffects:[],knownNpcs:[],startedAt:now,updatedAt:now,season2Complete:false,openingPhase:'pending'};
  localStorage.setItem(CAMPAIGN_KEY,JSON.stringify(c));
  if(window.state)state.campaign=c;
  return c;
}
function saveCampaign(c){if(!c)return; c.updatedAt=new Date().toISOString();localStorage.setItem(CAMPAIGN_KEY,JSON.stringify(c));if(window.state)state.campaign=c}
async function prepareNewGame(){
  const c=freshCampaign();
  const q=await loadStartQuest();
  state.hiddenQuest=q;
  state.campaign=c;
  try{localStorage.removeItem('valedouro.journal.pending.v1')}catch{}
  return q;
}
function canonicalOpening(){
 return 'A manhã começa tranquila em ValeDouro. A praça já desperta com o movimento cotidiano de moradores e comerciantes, enquanto as primeiras barracas são abertas e carroças cruzam lentamente as ruas. Você ainda não assumiu nenhuma tarefa e tem liberdade para decidir como começar o dia.\n\nPerto da praça, um mercador demonstra preocupação enquanto conversa com um guarda. Ao notar que você parece preparado para viajar, ele se aproxima com cautela. “Desculpe incomodar. Uma pequena caravana comercial era esperada em ValeDouro, mas não chegou no horário previsto. Ainda não sabemos o que aconteceu. Precisamos de alguém disposto a verificar o atraso e descobrir se eles precisam de ajuda. Você poderia nos ajudar?”\n\nO mercador aguarda sua resposta. Você pode perguntar sobre a caravana, buscar mais informações, preparar-se, aceitar, recusar ou simplesmente adiar a decisão.\n\nO que você faz?';
}
function installStartWrapper(){
  if(typeof window.startAdventure!=='function'){setTimeout(installStartWrapper,100);return}
  if(window.startAdventure.__vdQst001Start)return;
  const previous=window.startAdventure;
  const wrapped=async function(){await prepareNewGame();return previous.apply(this,arguments)};
  wrapped.__vdQst001Start=true;window.startAdventure=wrapped;
}
const previousFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  const ai=(typeof window.AI_ENDPOINT!=='undefined'?window.AI_ENDPOINT:(typeof AI_ENDPOINT!=='undefined'?AI_ENDPOINT:null));
  const isAI=ai&&String(url).replace(/\/$/,'')===String(ai).replace(/\/$/,'');
  let openingPending=false;
  if(isAI&&String(init?.method||'GET').toUpperCase()==='POST'&&init?.body){
    try{
      const b=JSON.parse(init.body),q=state?.hiddenQuest||null,c=state?.campaign||null;
      openingPending=!!(q?.id===START_QUEST&&c?.currentQuestId===START_QUEST&&c?.openingPhase==='pending');
      if(q){
        b.state={...(b.state||{}),activeQuestId:q.id,quest_context:q,questPhase:openingPending?'opening':'active'};
        b.world={...(b.world||{}),quest_contract:[
          `QUEST ATIVA OBRIGATÓRIA: ${q.id} — ${q.identity?.title||''}.`,
          'A quest_context é a fonte canônica autoritativa da missão atual.',
          'Na abertura, o único problema público é: UMA PEQUENA CARAVANA COMERCIAL ERA ESPERADA EM VALEDOURO E NÃO CHEGOU.',
          'A abertura precisa ter uma fonte plausível — mercador ou guarda — PEDINDO AJUDA diretamente ao personagem para verificar o atraso.',
          'Antes da aceitação, NÃO mencione último ponto de passagem confirmado, direção da estrada, mapa, bandidos, falha mecânica, aprendiz desaparecido, pistas, rumores, missão já aceita ou investigação já iniciada.',
          'Não diga que o personagem sente o peso da missão, veio investigar, sabe para onde ir ou está pronto para partir.',
          'Dê liberdade para perguntar, preparar-se, aceitar, recusar ou adiar. Só avance para a estrada após intenção explícita do jogador.',
          'Não revele template_truth, propositions ocultas, evidências ainda não descobertas ou outros segredos.'
        ].join(' ')};
      }
      init={...init,body:JSON.stringify(b)};
    }catch(e){console.warn('Quest inicial: não foi possível injetar contrato canônico',e)}
  }
  const res=await previousFetch(input,init);
  // A primeira fala de uma campanha nova é deliberadamente determinística. A IA assume a partir da resposta do jogador.
  if(openingPending){
    try{
      const data=await res.clone().json(),out={...data},text=canonicalOpening();
      if(typeof out.text==='string')out.text=text;else if(typeof out.reply==='string')out.reply=text;else out.text=text;
      const c=state?.campaign;if(c){c.openingPhase='presented';saveCampaign(c)}
      const headers=new Headers(res.headers);headers.set('Content-Type','application/json; charset=utf-8');
      return new Response(JSON.stringify(out),{status:res.status,statusText:res.statusText,headers});
    }catch(e){console.warn('QST-001: não foi possível aplicar abertura determinística',e)}
  }
  return res;
};
installStartWrapper();
window.ValeNewGameQuestStart={prepareNewGame,loadStartQuest,canonicalOpening};
})();
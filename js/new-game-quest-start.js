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
  const c={version:1,currentQuestId:START_QUEST,completedQuestIds:[],persistentEffects:[],knownNpcs:[],startedAt:now,updatedAt:now,season2Complete:false};
  localStorage.setItem(CAMPAIGN_KEY,JSON.stringify(c));
  if(window.state)state.campaign=c;
  return c;
}
async function prepareNewGame(){
  const c=freshCampaign();
  const q=await loadStartQuest();
  state.hiddenQuest=q;
  state.campaign=c;
  // limpa estados narrativos que não podem vazar de outra partida
  try{localStorage.removeItem('valedouro.journal.pending.v1')}catch{}
  return q;
}

function installStartWrapper(){
  if(typeof window.startAdventure!=='function'){setTimeout(installStartWrapper,100);return}
  if(window.startAdventure.__vdQst001Start)return;
  const previous=window.startAdventure;
  const wrapped=async function(){
    await prepareNewGame();
    return previous.apply(this,arguments);
  };
  wrapped.__vdQst001Start=true;
  window.startAdventure=wrapped;
}

// Última camada antes do Mestre: envia a quest ativa como contrato narrativo autoritativo.
const previousFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  const ai=(typeof window.AI_ENDPOINT!=='undefined'?window.AI_ENDPOINT:(typeof AI_ENDPOINT!=='undefined'?AI_ENDPOINT:null));
  if(ai&&url===ai&&String(init?.method||'GET').toUpperCase()==='POST'&&init?.body){
    try{
      const b=JSON.parse(init.body);
      const q=state?.hiddenQuest||null;
      if(q){
        b.state={...(b.state||{}),activeQuestId:q.id,quest_context:q};
        b.world={...(b.world||{}),quest_contract:[
          `QUEST ATIVA OBRIGATÓRIA: ${q.id} — ${q.identity?.title||''}.`,
          'A quest_context é a fonte canônica autoritativa da missão atual.',
          'Na abertura de uma nova campanha, siga opening_contract.required_flow na ordem e respeite forbidden_opening_shortcuts.',
          'Não invente outra missão, outro destino, ruína, bifurcação, presságio ou gancho que substitua a quest ativa.',
          'Não coloque os personagens na estrada antes de eles aceitarem/decidirem partir em linguagem natural.',
          'Não revele template_truth, propositions ocultas, evidências ainda não descobertas ou outros segredos da quest aos jogadores.',
          'Você pode improvisar apenas detalhes cosméticos compatíveis que não alterem fatos, pistas, locais, atores, causalidade ou progressão da quest.'
        ].join(' ')};
      }
      init={...init,body:JSON.stringify(b)};
    }catch(e){console.warn('Quest inicial: não foi possível injetar contrato canônico',e)}
  }
  return previousFetch(input,init);
};

installStartWrapper();
window.ValeNewGameQuestStart={prepareNewGame,loadStartQuest};
})();

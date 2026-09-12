// ValeDouro WEBIA — estado canônico da cena, continuidade e fallback determinístico do Diário
(function(){
'use strict';
if(window.__VALE_SCENE_CONTINUITY__) return;
window.__VALE_SCENE_CONTINUITY__=true;

const KEY='valedouro.scene-state.v1';
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
function activeCharacter(){return window.state?.characters?.[window.state?.active||0]||null}
function charKey(c){return `${c?.name||'sem-nome'}|${c?.cls||''}`}
function loadAll(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function saveAll(db){localStorage.setItem(KEY,JSON.stringify(db))}
function stateFor(c){const db=loadAll(),k=charKey(c);if(!db[k])db[k]={version:1,location:null,facts:[],allegations:[],pendingDecision:null,recentActions:[],updatedAt:null};const s=db[k];s.facts=Array.isArray(s.facts)?s.facts:[];s.allegations=Array.isArray(s.allegations)?s.allegations:[];s.recentActions=Array.isArray(s.recentActions)?s.recentActions:[];return s}
function persist(c,s){const db=loadAll();s.updatedAt=new Date().toISOString();db[charKey(c)]=s;saveAll(db);return s}
function isAI(url){try{return typeof AI_ENDPOINT!=='undefined'&&url===AI_ENDPOINT}catch{return false}}
function isRollResult(a){return /resultado do teste solicitado|resultado=sucesso|resultado=falha/i.test(String(a||''))}
function hasMovement(a){return /\b(vou|vamos|sigo|seguimos|caminho|caminhamos|entro|entramos|saio|saímos|parto|partimos|viajo|viajamos|vou ate|vou para|dirijo-me|desco|subo|retorno|volto)\b/i.test(String(a||''))}
function inferLocation(text){
  const t=norm(text);
  const rules=[
    [/praca central|na praca|pela praca|da praca/,'Praça de ValeDouro'],
    [/taverna|grifo dourado/,'Taverna'],
    [/porto|cais|baia/,'Porto de ValeDouro'],
    [/liceu/,'Liceu de Artífices'],
    [/forte de sao telmo|sao telmo/,'Forte de São Telmo'],
    [/estrada norte/,'Estrada Norte'],
    [/estrada|trilha/,'Estrada/Trilha'],
    [/floresta/,'Floresta'],
    [/mina/,'Mina'],
    [/granberg/,'GranBerg']
  ];
  for(const [re,name] of rules) if(re.test(t)) return name;
  return null;
}
function inferInitialLocation(body){
  const explicit=body?.state?.canonical_scene_state?.location?.name||body?.world?.current_location||null;
  if(explicit)return explicit;
  const h=Array.isArray(body?.history)?body.history:[];
  for(let i=h.length-1;i>=0;i--){const loc=inferLocation(h[i]?.content);if(loc)return loc}
  const q=body?.quest;
  const locs=Array.isArray(q?.locations)?q.locations:[];
  const start=locs.find(x=>x.id==='LOC-001')||locs[0];
  return start?.name||null;
}
function classifyDecision(action){
  const t=norm(action);
  if(!t||isRollResult(t))return null;
  if(/\b(furto|furto o|roubo|roubo o|roubo a|roubar|assalto|assaltar|subtraio|tomo para mim|pego .* sem permissao)\b/.test(t))return {type:'theft',title:'Aquilo que não era meu',body:'Hoje decidi tomar para mim aquilo que pertencia a outro. O resultado veio depois; a escolha foi minha.'};
  if(/\b(ataco|golpeio|esfaqueio|corto|estoco|agredo|desfiro um golpe|saco a espada.*golpe)\b/.test(t))return {type:'assault',title:'Sangue pela minha mão',body:'Hoje escolhi erguer minha arma contra outra pessoa. O resultado veio depois; a decisão foi minha.'};
  if(/\b(mato|executo|degolo|tiro a vida|ceifo a vida)\b/.test(t))return {type:'killing',title:'Uma vida ceifada',body:'Hoje decidi ceifar a vida de outrem. O que quer que tenha acontecido depois começou com essa escolha.'};
  if(/\b(ameaco|ameaço|intimido deliberadamente|vou te matar|juro que mato)\b/.test(t))return {type:'threat',title:'Uma ameaça',body:'Hoje escolhi usar o medo como instrumento. Minhas palavras também deixam marcas.'};
  if(/\b(minto|mentira|engano|finjo que|invento que)\b/.test(t))return {type:'deception',title:'Uma mentira',body:'Hoje escolhi esconder a verdade atrás de uma mentira. O mundo pode acreditar nela; eu sei o que fiz.'};
  return null;
}
function actionHash(s){let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function ensureJournalDecision(c,s,action,d){
  const id=`local-decision-${actionHash(action)}`;
  if(s.recentActions.some(x=>x.id===id))return null;
  const event={id,at:new Date().toISOString(),type:d.type,action:String(action),journalRecorded:false};
  if(window.ValeJournal?.addEntry){
    try{event.journalRecorded=!!window.ValeJournal.addEntry(c,{id,at:event.at,title:d.title,body:d.body,learnings:[],illustration:null,source:'decision-local'})}catch(e){console.warn('Continuidade: falha ao registrar decisão no Diário',e)}
  }
  s.recentActions.unshift({id,at:event.at,type:d.type});s.recentActions=s.recentActions.slice(0,50);
  s.pendingDecision=event;persist(c,s);return event;
}
function addUnidentifiedLoot(c,event){
  if(!c||!event||event.lootApplied)return false;
  const item={id:`unidentified-gems-${event.id}`,name:'Bolsa com pedras/gemas não identificadas',qty:1,unit:'un',category:'Objeto de valor',state:'available',source:'Obtido durante a aventura',unidentified:true};
  try{
    if(window.ValeInventory?.add){window.ValeInventory.add(c,item);event.lootApplied=true;return true}
  }catch(e){console.warn('Continuidade: ValeInventory.add falhou',e)}
  try{
    const K='valedouro.inventory.v2',db=JSON.parse(localStorage.getItem(K)||'{}'),k=charKey(c),inv=db[k]||{version:2,coins:{gold:0,silver:0,copper:0},items:[],resources:[],history:[],loadState:'normal'};
    inv.items=Array.isArray(inv.items)?inv.items:[];if(!inv.items.some(x=>x.id===item.id))inv.items.push(item);inv.history=Array.isArray(inv.history)?inv.history:[];inv.history.unshift({at:new Date().toISOString(),type:'add',item:item.id,qty:1});db[k]=inv;localStorage.setItem(K,JSON.stringify(db));c.inventoryState=inv;window.dispatchEvent(new CustomEvent('valedouro:inventory-change',{detail:{character:c.name}}));event.lootApplied=true;return true;
  }catch(e){console.warn('Continuidade: fallback de inventário falhou',e);return false}
}
function addFact(s,fact){if(!fact)return;if(!s.facts.some(x=>x.text===fact))s.facts.unshift({at:new Date().toISOString(),text:fact});s.facts=s.facts.slice(0,100)}
function continuityContract(s,pending){
  const loc=s.location?.name||'não estabelecido';
  return [
    'ESTADO CANÔNICO DA CENA — OBRIGATÓRIO.',
    `LOCAL ATUAL: ${loc}.`,
    'O local atual NÃO pode mudar sem deslocamento explicitamente declarado pelo jogador ou por um evento já estabelecido. Nunca teletransporte a cena para taverna, rua, floresta, porto, interior ou outro ambiente apenas para acomodar a ação.',
    'DECLARAÇÃO DO JOGADOR é intenção/alegação, não fato do mundo. Mentiras, parentescos, cadáveres, crimes, objetos e acontecimentos citados pelo jogador não se tornam verdade só por terem sido mencionados.',
    'PERSISTÊNCIA DE ESPECIFICIDADE: informação desconhecida permanece desconhecida. Se algo foi descrito apenas como pedras, gemas, joias ou conteúdo não identificado, NÃO o transforme em rubis, esmeraldas, ouro específico ou outro material sem uma ação de identificação ou fato canônico.',
    'Separe sempre: decisão do personagem -> tentativa -> resultado -> quem percebeu -> quem identificou o autor -> consequência social/legal.',
    'Dados resolvem a incerteza do resultado; nunca criam ou apagam a decisão moral/social tomada.',
    pending?`DECISÃO LOCAL JÁ REGISTRADA NO DIÁRIO: ${pending.type}. Ao emitir [[REPUTATION:...]], use "journal":false para evitar duplicação; o marcador deve tratar apenas consequências públicas/legais.`:'',
    s.facts.length?`FATOS PERSISTENTES RECENTES: ${s.facts.slice(0,8).map(x=>x.text).join(' | ')}`:''
  ].filter(Boolean).join(' ');
}

function install(){
  if(window.__VALE_SCENE_CONTINUITY_FETCH__)return;
  window.__VALE_SCENE_CONTINUITY_FETCH__=true;
  const previousFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    if(!isAI(url)||!init?.body||String(init.method||'GET').toUpperCase()!=='POST')return previousFetch(input,init);
    let body,action='',c=activeCharacter(),s=c?stateFor(c):null,pending=null,patched=init;
    try{
      body=JSON.parse(init.body);action=String(body?.action||'');
      if(c&&s){
        if(!s.location?.name){const inferred=inferInitialLocation(body);if(inferred)s.location={name:inferred,establishedAt:new Date().toISOString(),source:'history-or-quest'};}
        const decision=classifyDecision(action);if(decision)pending=ensureJournalDecision(c,s,action,decision)||s.pendingDecision;else pending=s.pendingDecision;
        const contract=continuityContract(s,pending);
        body.state={...(body.state||{}),canonical_scene_state:{location:s.location,facts:s.facts.slice(0,20),allegations:s.allegations.slice(0,20),pendingDecision:pending?{id:pending.id,type:pending.type,action:pending.action}:null}};
        body.world={...(body.world||{}),scene_continuity_contract:contract};
        body.action=contract+' '+action;
        patched={...init,body:JSON.stringify(body)};persist(c,s);
      }
    }catch(e){console.warn('Continuidade: não foi possível preparar contexto',e)}
    const res=await previousFetch(input,patched);
    if(!c||!s||!res.ok)return res;
    try{
      const data=await res.clone().json();const text=String(data?.reply??data?.text??'');
      if(!s.location?.name){const loc=inferLocation(text);if(loc)s.location={name:loc,establishedAt:new Date().toISOString(),source:'narrative'};}
      else if(hasMovement(action)){const loc=inferLocation(text);if(loc)s.location={name:loc,establishedAt:new Date().toISOString(),source:'explicit-movement'};}
      if(/pedras cintilantes|gemas? de valor|joias?[^.]{0,40}nao identific/i.test(text))addFact(s,'Há pedras/gemas de valor ainda não identificadas; sua composição exata permanece desconhecida.');
      if(isRollResult(action)&&s.pendingDecision){
        const success=/resultado=sucesso|resultado\s*=\s*sucesso|resultado[^.]{0,20}sucesso/i.test(action);
        const fail=/resultado=falha|resultado\s*=\s*falha|resultado[^.]{0,20}falha/i.test(action);
        if(success){s.pendingDecision.result='success';if(s.pendingDecision.type==='theft'&&/joia|gema|pedra|bolsa/i.test(s.pendingDecision.action||''))addUnidentifiedLoot(c,s.pendingDecision);addFact(s,`Decisão ${s.pendingDecision.type} teve resultado mecânico de sucesso; isso não implica autoria conhecida publicamente.`);s.pendingDecision=null;}
        else if(fail){s.pendingDecision.result='failure';addFact(s,`Decisão ${s.pendingDecision.type} teve resultado mecânico de falha; a decisão continua registrada, mas não deve ser reinterpretada pelo dado.`);s.pendingDecision=null;}
      }
      persist(c,s);
    }catch(e){console.warn('Continuidade: resposta não processada',e)}
    return res;
  };
}

window.ValeSceneState={stateFor,activeCharacter};
install();
})();

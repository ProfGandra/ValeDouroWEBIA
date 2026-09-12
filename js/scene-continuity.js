// ValeDouro WEBIA — estado canônico da cena, continuidade e Diário episódico
(function(){
'use strict';
if(window.__VALE_SCENE_CONTINUITY__) return;
window.__VALE_SCENE_CONTINUITY__=true;

const KEY='valedouro.scene-state.v1';
const JOURNAL_KEY='valedouro.journal.v1';
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
function activeCharacter(){return window.state?.characters?.[window.state?.active||0]||null}
function charKey(c){return `${c?.name||'sem-nome'}|${c?.cls||''}`}
function loadAll(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function saveAll(db){localStorage.setItem(KEY,JSON.stringify(db))}
function stateFor(c){
  const db=loadAll(),k=charKey(c);
  if(!db[k])db[k]={version:2,location:null,timeOfDay:null,facts:[],allegations:[],pendingDecision:null,recentActions:[],updatedAt:null};
  const s=db[k];
  s.version=2;
  s.facts=Array.isArray(s.facts)?s.facts:[];
  s.allegations=Array.isArray(s.allegations)?s.allegations:[];
  s.recentActions=Array.isArray(s.recentActions)?s.recentActions:[];
  if(!('timeOfDay' in s))s.timeOfDay=null;
  return s;
}
function persist(c,s){const db=loadAll();s.updatedAt=new Date().toISOString();db[charKey(c)]=s;saveAll(db);return s}
function isAI(url){try{return typeof AI_ENDPOINT!=='undefined'&&url===AI_ENDPOINT}catch{return false}}
function isRollResult(a){return /resultado do teste solicitado|resultado=sucesso|resultado=falha/i.test(String(a||''))}
function hasMovement(a){return /\b(vou|vamos|sigo|seguimos|caminho|caminhamos|entro|entramos|saio|saímos|parto|partimos|viajo|viajamos|vou ate|vou para|dirijo-me|desco|subo|retorno|volto)\b/i.test(String(a||''))}
function hasTimeAdvance(a){return /\b(espero|aguardo|durmo|descanso|amanhece|anoitece|passam? horas?|mais tarde|no dia seguinte|na manha seguinte)\b/i.test(norm(a))}
function inferLocation(text){
  const t=norm(text);
  const rules=[
    [/corvo de prata/,'Taverna O Corvo de Prata'],
    [/grifo dourado/,'Taverna O Grifo Dourado'],
    [/praca central|na praca|pela praca|da praca/,'Praça de ValeDouro'],
    [/taverna/,'Taverna'],
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
function inferTime(text){
  const t=norm(text);
  if(/\bmadrugada\b/.test(t))return 'madrugada';
  if(/\bmanha\b|amanhecer|primeiro toque do dia|sol .*horizonte/.test(t))return 'manhã';
  if(/\btarde\b|entardecer/.test(t))return 'tarde';
  if(/\bnoite\b|anoitecer|luar/.test(t))return 'noite';
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
function inferInitialTime(body){
  const explicit=body?.state?.canonical_scene_state?.timeOfDay||body?.world?.time_of_day||null;
  if(explicit)return explicit;
  const h=Array.isArray(body?.history)?body.history:[];
  for(let i=h.length-1;i>=0;i--){const tod=inferTime(h[i]?.content);if(tod)return tod}
  return null;
}
function classifyDecision(action){
  const t=norm(action);
  if(!t||isRollResult(t))return null;
  if(/\b(furto|furto o|roubo|roubo o|roubo a|roubar|assalto|assaltar|subtraio|tomo para mim|pego .* sem permissao)\b/.test(t))return {type:'theft',title:'Aquilo que não era meu',body:'Hoje decidi tomar para mim aquilo que pertencia a outro. O resultado veio depois; a escolha foi minha.'};
  if(/\b(mato|executo|degolo|tiro a vida|ceifo a vida|dou o golpe final|acabo com ele|acabo com ela)\b/.test(t))return {type:'killing',title:'Uma vida ceifada',body:'Hoje decidi tirar uma vida. Não foi acidente: foi uma escolha, e sei que haverá consequências.'};
  if(/confirmo?\s+(?:a|sua|a sua)?\s*morte|certifico[- ]?me\s+de\s+que\s+.*morto|verifico\s+se\s+.*morto/.test(t))return {type:'death-confirmation',title:'Uma morte confirmada',body:'Depois do confronto, confirmei que a vida diante de mim havia terminado. Saí sabendo que aquela morte passaria a fazer parte da minha história.'};
  if(/\b(ataco|golpeio|esfaqueio|corto|estoco|agredo|desfiro um golpe|perfuro|atravesso|cravo|enfio|apunhalo|soco|chuto|disparo contra|saco (?:minha|a) espada|saco (?:meu|o) machado)\b/.test(t))return {type:'assault',title:'Sangue pela minha mão',body:'Hoje escolhi erguer minha arma contra outra pessoa. O resultado veio depois; a decisão foi minha.'};
  if(/\b(ameaco|ameaço|intimido deliberadamente|vou te matar|juro que mato)\b/.test(t))return {type:'threat',title:'Uma ameaça',body:'Hoje escolhi usar o medo como instrumento. Minhas palavras também deixam marcas.'};
  if(/\b(minto|mentira|engano|finjo que|invento que)\b/.test(t))return {type:'deception',title:'Uma mentira',body:'Hoje escolhi esconder a verdade atrás de uma mentira. O mundo pode acreditar nela; eu sei o que fiz.'};
  return null;
}
function actionHash(s){let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function journalBodyFor(d,s){
  const loc=s?.location?.name?` em ${s.location.name}`:'';
  const when=s?.timeOfDay?` durante a ${s.timeOfDay}`:'';
  if(d.type==='assault')return `Hoje${loc}${when}, escolhi erguer minha arma contra outra pessoa. Não foi um acidente nem uma decisão tomada por mim sem intenção. O resultado ainda teria de se revelar, mas a escolha foi minha.`;
  if(d.type==='killing')return `Hoje${loc}${when}, decidi tirar uma vida. O que quer que venha depois começou com essa escolha.`;
  if(d.type==='death-confirmation')return `Hoje${loc}${when}, confirmei a morte de alguém após o confronto. Saí sabendo que esse acontecimento e suas consequências passariam a fazer parte da minha história.`;
  return d.body;
}
function upsertJournal(c,e){
  if(!c||!e)return false;
  const k=charKey(c);
  try{
    const all=JSON.parse(localStorage.getItem(JOURNAL_KEY)||'{}');
    const j=all[k];
    if(j?.active&&Array.isArray(j.entries)){
      const found=j.entries.find(x=>x.id===e.id);
      if(found){Object.assign(found,e);j.updatedAt=new Date().toISOString();all[k]=j;localStorage.setItem(JOURNAL_KEY,JSON.stringify(all));window.dispatchEvent(new CustomEvent('valedouro:journal-change'));return true;}
    }
  }catch{}
  try{return !!window.ValeJournal?.addEntry?.(c,e)}catch(err){console.warn('Continuidade: falha ao registrar episódio no Diário',err);return false}
}
function ensureJournalDecision(c,s,action,d){
  const id=`local-decision-${actionHash(action)}`;
  if(s.recentActions.some(x=>x.id===id))return null;
  const event={id,at:new Date().toISOString(),type:d.type,action:String(action),journalRecorded:false,title:d.title,body:journalBodyFor(d,s)};
  event.journalRecorded=upsertJournal(c,{id,at:event.at,title:event.title,body:event.body,learnings:[],people:[],places:s.location?.name?[s.location.name]:[],illustration:null,source:'episode-local'});
  s.recentActions.unshift({id,at:event.at,type:d.type});s.recentActions=s.recentActions.slice(0,50);
  s.pendingDecision=event;persist(c,s);return event;
}
function addUnidentifiedLoot(c,event){
  if(!c||!event||event.lootApplied)return false;
  const item={id:`unidentified-gems-${event.id}`,name:'Bolsa com pedras/gemas não identificadas',qty:1,unit:'un',category:'Objeto de valor',state:'available',source:'Obtido durante a aventura',unidentified:true};
  try{if(window.ValeInventory?.add){window.ValeInventory.add(c,item);event.lootApplied=true;return true}}catch(e){console.warn('Continuidade: ValeInventory.add falhou',e)}
  try{
    const K='valedouro.inventory.v2',db=JSON.parse(localStorage.getItem(K)||'{}'),k=charKey(c),inv=db[k]||{version:2,coins:{gold:0,silver:0,copper:0},items:[],resources:[],history:[],loadState:'normal'};
    inv.items=Array.isArray(inv.items)?inv.items:[];if(!inv.items.some(x=>x.id===item.id))inv.items.push(item);inv.history=Array.isArray(inv.history)?inv.history:[];inv.history.unshift({at:new Date().toISOString(),type:'add',item:item.id,qty:1});db[k]=inv;localStorage.setItem(K,JSON.stringify(db));c.inventoryState=inv;window.dispatchEvent(new CustomEvent('valedouro:inventory-change',{detail:{character:c.name}}));event.lootApplied=true;return true;
  }catch(e){console.warn('Continuidade: fallback de inventário falhou',e);return false}
}
function addFact(s,fact){if(!fact)return;if(!s.facts.some(x=>x.text===fact))s.facts.unshift({at:new Date().toISOString(),text:fact});s.facts=s.facts.slice(0,100)}
function deathConfirmed(text){return /\b(morreu|morto|morta|sem vida|óbito|obito|não respira|nao respira|ausência de respiração|ausencia de respiracao|morte confirmada)\b/i.test(String(text||''))}
function extractDeathName(text){
  const src=String(text||'');
  const patterns=[
    /\b([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÀ-ÖØ-öø-ÿ'’-]{2,})\b[^.!?]{0,90}\b(?:morreu|morto|morta|sem vida|não respira|nao respira)\b/,
    /\b(?:morte|óbito|obito)\s+de\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÀ-ÖØ-öø-ÿ'’-]{2,})\b/,
    /\b([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÀ-ÖØ-öø-ÿ'’-]{2,})\b[^.!?]{0,70}\b(?:cai|jazia|jaz)\b[^.!?]{0,60}\b(?:sem vida|morto|morta)\b/
  ];
  for(const re of patterns){const m=src.match(re);if(m?.[1])return m[1]}
  return null;
}
function enrichJournalOutcome(c,s,event,text){
  if(!event||!event.id)return;
  const death=deathConfirmed(text),name=death?extractDeathName(text):null;
  if(death&&(event.type==='assault'||event.type==='killing'||event.type==='death-confirmation')){
    const loc=s.location?.name?` em ${s.location.name}`:'';
    const who=name?` ${name}`:' a pessoa que ataquei';
    const body=event.type==='death-confirmation'
      ?`Hoje${loc}, confirmei que${who} estava morto. Não posso tratar isso como um detalhe passageiro: essa morte agora faz parte das consequências das minhas escolhas.`
      :`Hoje${loc}, ergui minha arma contra outra pessoa. O confronto terminou em morte${name?`: ${name} não sobreviveu.`:'.'} O que aconteceu foi testemunhado pelo mundo ao meu redor e poderá trazer consequências.`;
    event.body=body;event.outcome='death';event.targetName=name||event.targetName||null;
    upsertJournal(c,{id:event.id,at:event.at,title:event.type==='assault'?'Sangue e consequência':event.title||'Uma vida ceifada',body,learnings:[],people:name?[name]:[],places:s.location?.name?[s.location.name]:[],illustration:null,source:'episode-local'});
    if(name)addFact(s,`${name} está morto. Esse estado não pode ser revertido sem um evento canônico explícito.`);
    else addFact(s,'Uma pessoa morreu como consequência direta do confronto recente. O Mestre deve preservar esse fato e não narrá-la como viva depois.');
  }
}
function continuityContract(s,pending){
  const loc=s.location?.name||'não estabelecido';
  const tod=s.timeOfDay||'não estabelecido';
  return [
    'ESTADO CANÔNICO DA CENA — OBRIGATÓRIO.',
    `LOCAL ATUAL: ${loc}.`,
    `PERÍODO ATUAL: ${tod}.`,
    'O local atual NÃO pode mudar sem deslocamento explicitamente declarado pelo jogador ou por um evento já estabelecido. Nunca teletransporte a cena para taverna, rua, floresta, porto, interior ou outro ambiente apenas para acomodar a ação.',
    'O período do dia NÃO pode mudar de manhã para tarde/noite, ou o inverso, sem passagem de tempo estabelecida. Não invente noite, amanhecer ou horas decorridas só para dar atmosfera.',
    'CONTINUIDADE DE NPC É RÍGIDA: preserve exatamente nome, função, identidade, condição física e relação já estabelecidos. Não transforme um taverneiro em empregado de um novo dono; não renomeie Harkin/Hark/Galdor ou qualquer NPC; não crie substitutos para preencher uma cena já povoada.',
    'ESTADO DE VIDA É FATO FORTE: se alguém está morto, permaneça morto; se está ferido mas vivo, não o declare morto sem novo evento; nunca escreva no mesmo turno que alguém está morto e depois que geme, respira ou se levanta.',
    'Antes de responder, reconcilie a nova narração com o histórico recente. Se houver duas interpretações possíveis, prefira a que mantém nomes, papéis, horário, local e consequências já estabelecidos.',
    'DECLARAÇÃO DO JOGADOR é intenção/alegação, não fato do mundo. Mentiras, parentescos, cadáveres, crimes, objetos e acontecimentos citados pelo jogador não se tornam verdade só por terem sido mencionados.',
    'PERSISTÊNCIA DE ESPECIFICIDADE: informação desconhecida permanece desconhecida. Se algo foi descrito apenas como pedras, gemas, joias ou conteúdo não identificado, NÃO o transforme em rubis, esmeraldas, ouro específico ou outro material sem uma ação de identificação ou fato canônico.',
    'Separe sempre: decisão do personagem -> tentativa -> resultado -> quem percebeu -> quem identificou o autor -> consequência social/legal.',
    'Dados resolvem a incerteza do resultado; nunca criam ou apagam a decisão moral/social tomada.',
    pending?`DECISÃO LOCAL JÁ REGISTRADA NO DIÁRIO: ${pending.type}. Ao emitir [[REPUTATION:...]], use "journal":false para evitar duplicação; o marcador deve tratar apenas consequências públicas/legais.`:'',
    s.facts.length?`FATOS PERSISTENTES RECENTES: ${s.facts.slice(0,10).map(x=>x.text).join(' | ')}`:''
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
        if(!s.timeOfDay){const inferredTime=inferInitialTime(body);if(inferredTime)s.timeOfDay=inferredTime;}
        const decision=classifyDecision(action);if(decision)pending=ensureJournalDecision(c,s,action,decision)||s.pendingDecision;else pending=s.pendingDecision;
        const contract=continuityContract(s,pending);
        body.state={...(body.state||{}),canonical_scene_state:{location:s.location,timeOfDay:s.timeOfDay,facts:s.facts.slice(0,25),allegations:s.allegations.slice(0,20),pendingDecision:pending?{id:pending.id,type:pending.type,action:pending.action}:null}};
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
      if(!s.timeOfDay){const tod=inferTime(text);if(tod)s.timeOfDay=tod;}
      else if(hasTimeAdvance(action)){const tod=inferTime(text);if(tod)s.timeOfDay=tod;}
      if(/pedras cintilantes|gemas? de valor|joias?[^.]{0,40}nao identific/i.test(text))addFact(s,'Há pedras/gemas de valor ainda não identificadas; sua composição exata permanece desconhecida.');
      if(pending)enrichJournalOutcome(c,s,pending,text);
      if(isRollResult(action)&&s.pendingDecision){
        const current=s.pendingDecision;
        const success=/resultado=sucesso|resultado\s*=\s*sucesso|resultado[^.]{0,20}sucesso/i.test(action);
        const fail=/resultado=falha|resultado\s*=\s*falha|resultado[^.]{0,20}falha/i.test(action);
        if(success){
          current.result='success';
          if(current.type==='theft'&&/joia|gema|pedra|bolsa/i.test(current.action||''))addUnidentifiedLoot(c,current);
          enrichJournalOutcome(c,s,current,text);
          addFact(s,`Decisão ${current.type} teve resultado mecânico de sucesso; isso não implica autoria conhecida publicamente.`);
          s.pendingDecision=null;
        } else if(fail){
          current.result='failure';
          addFact(s,`Decisão ${current.type} teve resultado mecânico de falha; a decisão continua registrada, mas não deve ser reinterpretada pelo dado.`);
          s.pendingDecision=null;
        }
      }
      persist(c,s);
    }catch(e){console.warn('Continuidade: resposta não processada',e)}
    return res;
  };
}

window.ValeSceneState={stateFor,activeCharacter};
install();
})();

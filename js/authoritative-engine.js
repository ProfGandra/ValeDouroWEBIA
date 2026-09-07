// ValeDouro WEBIA — Motor Autoritativo de Estado e Arbitragem
// A IA interpreta e narra; o WEBIA preserva fatos, recursos, dados e limites mecânicos.
(function(){
'use strict';
if(window.__VALE_AUTHORITATIVE_ENGINE__) return;
window.__VALE_AUTHORITATIVE_ENGINE__=true;

const KEY='valedouro.authority.v1';
const DICE_KEY='valedouro.dice-audit.v1';
const nativeFetch=window.fetch.bind(window);
const numberWords={dois:2,duas:2,'três':3,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10};

function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function save(s){s.version=1;s.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(s));return s}
function auth(){const s=read();s.encounters=s.encounters||{};s.rolls=s.rolls||{};s.facts=s.facts||{};return s}
function normalize(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim()}
function questId(){try{return window.ValeDouroCampaign?.read?.()?.currentQuestId||state?.hiddenQuest?.id||null}catch{return null}}
function sceneId(){try{return window.ValeSceneVisuals?.read?.()?.sceneId||null}catch{return null}}
function encounterKey(){return `${questId()||'free'}:${sceneId()||'scene'}`}
function currentEncounter(){const s=auth(),k=encounterKey();s.encounters[k]=s.encounters[k]||{visibleHostiles:null,establishedAt:null,updatedAt:null};save(s);return s.encounters[k]}
function setEncounterCount(n){if(!Number.isInteger(n)||n<1)return;const s=auth(),k=encounterKey();const e=s.encounters[k]||{};e.visibleHostiles=n;e.establishedAt=e.establishedAt||new Date().toISOString();e.updatedAt=new Date().toISOString();s.encounters[k]=e;save(s)}

function activeCharacter(){return state?.characters?.[state?.active||0]||null}
function inv(c=activeCharacter()){try{return c&&window.ValeInventory?.ensure?.(c)||null}catch{return null}}
function inventoryItems(c=activeCharacter()){
  const i=inv(c);if(!i)return [];
  return [...(i.items||[]),...(i.resources||[])].filter(x=>Number(x.qty||0)>0&&!['lost','abandoned'].includes(x.state)).map(x=>({id:x.id,name:x.name,qty:Number(x.qty||0),unit:x.unit||'un',state:x.state||'available',category:x.category||'Item',ammunition:!!x.ammunition}));
}
function ammoItem(c=activeCharacter()){return inventoryItems(c).find(x=>x.ammunition)||null}
function authoritativeSnapshot(){
  const c=activeCharacter(),e=currentEncounter();
  return {
    policy:'WEBIA_STATE_IS_ABSOLUTE_TRUTH',questId:questId(),sceneId:sceneId(),
    character:c?{name:c.name,hp:c.hp,hpMax:c.hpMax,ca:c.ca,armor:c.armor,shieldEquipped:!!c.shield,equipment:Array.isArray(c.equipment)?c.equipment:[],inventory:inventoryItems(c)}:null,
    encounter:{visibleHostiles:e.visibleHostiles,rule:'Once a visible hostile count is established in this scene, do not change it or create reinforcements unless an explicit game-state event authorizes it.'},
    rules:[
      'The WEBIA state is authoritative. Never contradict inventory quantities, equipped gear, HP, AC, ammunition, or established encounter facts.',
      'Do not invent exact quantities of people, wagons, enemies, money or items unless they exist in quest/state/history.',
      'Do not create additional enemies merely to increase tension.',
      'A player declaration describes intent, not automatic success. Attacks and uncertain actions must be rolled before outcome narration.',
      'Do not request a roll for trivial deterministic actions such as dropping a held shield, drawing/sheathing a weapon, or handling an owned accessible item.',
      'A failed required check must change the situation and move play forward with a cost/consequence. Do not ask for the same check again unless circumstances materially changed.'
    ]
  };
}

function classifyAction(raw){
  const t=normalize(raw);
  const risky=/(atac|dispar|atira|corro|salto|escal|furtiv|flanco|esquivo|persuad|intimid|arrombo|forco|rastre|procuro|investig)/.test(t);
  if(/(largo|solto|deixo|ponho).{0,30}escudo/.test(t)&&!risky)return {type:'drop_shield',deterministic:true,requiresRoll:false};
  if(/(pego|recolho|apanho|recupero).{0,30}escudo/.test(t)&&!risky)return {type:'pick_shield',deterministic:true,requiresRoll:false};
  if(/(saco|desembainho|empunho|guardo|embainho).{0,35}(espada|arma|arco)/.test(t)&&!risky)return {type:'ready_weapon',deterministic:true,requiresRoll:false};
  if(/(disparo|ataco|atira|solto).{0,45}(arco|flecha)|(?:arco|flecha).{0,45}(disparo|ataco|atira)/.test(t))return {type:'ranged_attack',deterministic:false,requiresRoll:true};
  if(/(ataco|golpeio|corto|estoco|desfiro).{0,45}(espada|machado|adaga|bandido|inimigo|oponente)|(?:espada|machado|adaga).{0,35}(ataco|golpeio|corto|estoco)/.test(t))return {type:'melee_attack',deterministic:false,requiresRoll:true};
  return {type:'general',deterministic:false,requiresRoll:false};
}
function actionText(body){return String(body?.action||'')}
function declaredPlayerText(){try{return String(document.getElementById('action')?.value||'')}catch{return ''}}

function applyDeterministicState(action){
  const c=activeCharacter();if(!c)return;
  if(action.type==='drop_shield'&&c.shield){c.shield=false;try{c.ca=armorCA(c.armor,mod(c.attrs.DES),false)}catch{c.ca=Math.max(0,Number(c.ca||0)-2)}try{saveChars();renderParty()}catch{}}
  if(action.type==='pick_shield'&&!c.shield&&Array.isArray(c.equipment)&&c.equipment.includes('shield')){c.shield=true;try{c.ca=armorCA(c.armor,mod(c.attrs.DES),true)}catch{c.ca=Number(c.ca||0)+2}try{saveChars();renderParty()}catch{}}
}
function deterministicFallback(type){if(type==='drop_shield')return 'Mestre: Você simplesmente solta o escudo. Ele cai ao chão ao seu lado, deixando sua mão livre. A ação não exige teste. O que você faz?';if(type==='pick_shield')return 'Mestre: Você recolhe o escudo e volta a mantê-lo pronto para uso. A ação não exige teste. O que você faz?';return 'Mestre: Você realiza a preparação simples que declarou, sem necessidade de teste. O que você faz?'}

function secureDie(sides){sides=Math.max(2,Math.floor(Number(sides)||20));if(window.crypto?.getRandomValues){const max=Math.floor(0x100000000/sides)*sides,a=new Uint32Array(1);let x;do{window.crypto.getRandomValues(a);x=a[0]}while(x>=max);return (x%sides)+1}return 1+Math.floor(Math.random()*sides)}
function logDie(sides,value){try{let a=JSON.parse(localStorage.getItem(DICE_KEY)||'[]');a.push({at:new Date().toISOString(),sides,value});localStorage.setItem(DICE_KEY,JSON.stringify(a.slice(-5000)))}catch{}}
function rollSignature(r){return `${r?.attr||''}|${normalize(r?.motivo||'').slice(0,90)}`}
function registerRollResult(r,success){const s=auth(),sig=rollSignature(r),prev=s.rolls[sig]||{failures:0};prev.failures=success?0:(prev.failures||0)+1;prev.lastAt=new Date().toISOString();s.rolls[sig]=prev;save(s);return prev.failures}

window.rollCheck=async function(){
  const r=state?.pendingCheck;if(!r)return;const p=state.characters[r.playerIndex],d20=secureDie(20),bonus=mod(p.attrs[r.attr]),total=d20+bonus,success=total>=r.cd;logDie(20,d20);
  document.getElementById('die').textContent=d20;document.getElementById('rollResult').innerHTML=`${esc(p.name)}: ${r.attr} ${fmt(bonus)} = <strong>${total}</strong> vs CD ${r.cd} — <span class="${success?'pass':'fail'}">${success?'SUCESSO':'FALHA'}</span>`;document.getElementById('rollBtn').disabled=true;addStory(`<b>Rolagem de ${esc(p.name)}:</b> d20 ${d20} ${fmt(bonus)} = ${total} vs CD ${r.cd} — ${success?'SUCESSO':'FALHA'}`,'system');
  const failures=registerRollResult(r,success);let msg=`Resultado do teste solicitado para ${p.name}: ${r.attr}, d20=${d20}, modificador=${bonus}, total=${total}, CD=${r.cd}, resultado=${success?'sucesso':'falha'}, motivo=${r.motivo}. Narre a consequência e continue a cena.`;
  if(!success)msg+=' REGRA FAIL-FORWARD: esta falha deve alterar a situação e fazer a narrativa avançar com custo, atraso, risco ou posição desfavorável. Não bloqueie a progressão.';
  if(!success&&failures>=2)msg+=` Esta é a ${failures}ª falha recente no mesmo tipo de teste. É PROIBIDO pedir a mesma rolagem novamente sem mudança material das circunstâncias; avance por consequência.`;
  state.history.push({role:'user',content:msg});state.pendingCheck=null;setTimeout(()=>document.getElementById('rollbox').classList.remove('active'),1000);await askAI(msg)
};
window.quickDie=function(){const sides=+document.getElementById('dieType').value,n=secureDie(sides);logDie(sides,n);document.getElementById('quickResult').textContent=`d${sides}: ${n}`};

function countFromText(text){const t=normalize(text),found=[];const re=/\b(dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|\d+)\s+(bandidos?|inimigos?|arqueiros?|figuras encapuzadas?)\b/g;let m;while((m=re.exec(t))){const n=/^\d+$/.test(m[1])?Number(m[1]):numberWords[m[1]];if(n>=2)found.push(n)}return found.length?Math.max(...found):null}
function hasForbiddenReinforcement(text){return /reforc|mais bandid|outros? (?:dois|tres|quatro|cinco|\d+) (?:bandid|arqueir|inimig)|grupo inteiro|os demais se aproximam/.test(normalize(text))}
function hasAmmoContradiction(text,snapshot){const q=snapshot?.character?.inventory?.find(x=>x.ammunition)?.qty||0;if(q<=0)return false;const t=normalize(text);return /(sua aljava (?:esta )?vazia|voce (?:esta )?sem flechas|voce nao (?:tem|possui) (?:mais )?flechas|sem flechas voce|nao ha como armar outro disparo|nao possui municao)/.test(t)}
function rollMarker(text){return String(text||'').match(/\[\[ROLL:(FOR|DES|CON|INT|SAB|CAR):(\d+):([^\]]+)\]\]/i)}
function outcomeBeforeRoll(text){const m=rollMarker(text);if(!m)return false;const before=normalize(String(text).slice(0,String(text).indexOf(m[0])));return /(acerta|atinge|erra|falha|consegue|derruba|mata|cai ao chao|fica ferido|sofre dano|desarma|escapa|vence|perde o alvo)/.test(before)}
function looksTruncated(text){const s=String(text||'').trim();if(s.length<180)return false;if(/\[\[[A-Z_]+/.test(s.slice(-60)))return true;return !/[.!?…\)\]”"']$/.test(s)}
function replaceFields(data,text){const out={...data};if(typeof out.reply==='string')out.reply=text;if(typeof out.text==='string')out.text=text;return out}
function jsonResponse(res,data){const h=new Headers(res.headers);h.set('Content-Type','application/json; charset=utf-8');return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers:h})}
function masterDirective(action){return ['MOTOR AUTORITATIVO DO WEBIA — OBRIGATÓRIO.','Você é o Mestre narrativo, não a fonte de verdade mecânica.','Use authoritative_state como verdade absoluta. Nunca contradiga inventário, munição, equipamento, CA, PV ou fatos de encontro.',action.deterministic?'A ação atual é DETERMINÍSTICA e não exige rolagem. Narre sua realização sem pedir [[ROLL]].':action.requiresRoll?'A ação atual é um ATAQUE e exige rolagem antes de qualquer resultado. Peça [[ROLL]] apropriado e não narre acerto, erro, dano ou morte antes do resultado.':'Só peça [[ROLL]] quando existir incerteza relevante e uma consequência real para falha.','Se pedir [[ROLL]], NÃO narre sucesso, falha, acerto, erro, dano ou consequência antes de receber o resultado da rolagem.','Não invente inimigos extras nem reforços. Uma contagem de hostis já estabelecida na cena permanece fixa até um evento explícito do estado.','Falhas necessárias à progressão devem produzir consequência e avanço, nunca loops de repetição da mesma perícia.','Não invente números exatos ausentes do estado/cânone. Se um NPC não sabe uma quantidade, diga que não sabe ao certo.'].join(' ')}

window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||''),ai=(typeof AI_ENDPOINT!=='undefined'?AI_ENDPOINT:null);if(url!==ai||!init?.body||String(init.method||'GET').toUpperCase()!=='POST')return nativeFetch(input,init);
  let body,action={type:'general',deterministic:false,requiresRoll:false},snapshot;
  try{body=JSON.parse(init.body);action=classifyAction(actionText(body));snapshot=authoritativeSnapshot();body.state={...(body.state||{}),authoritative_state:snapshot};body.world={...(body.world||{}),authoritative_engine:masterDirective(action),player_declared_action:String(body.action||'')}}catch(e){console.warn('Motor autoritativo: não foi possível preparar contexto',e);return nativeFetch(input,init)}
  let res=await nativeFetch(input,{...init,body:JSON.stringify(body)});
  try{
    let data=await res.clone().json(),text=String(data?.reply??data?.text??'');const enc=currentEncounter(),count=countFromText(text),existing=enc.visibleHostiles;let violation=null;
    if(action.deterministic&&rollMarker(text))violation='A ação é determinística; remova a rolagem e narre apenas sua execução.';
    else if(action.requiresRoll&&!rollMarker(text))violation='Ataques não podem ser resolvidos diretamente. Reescreva a tentativa e solicite uma rolagem antes de qualquer acerto, erro ou dano.';
    else if(outcomeBeforeRoll(text))violation='Você resolveu a ação antes da rolagem. Reescreva: descreva apenas a tentativa e peça a rolagem, sem dizer se funcionou.';
    else if(hasAmmoContradiction(text,snapshot))violation='Você contradisse a munição autoritativa do personagem. Reescreva respeitando exatamente a quantidade disponível.';
    else if(existing&&count&&count!==existing)violation=`A cena já estabeleceu ${existing} hostis visíveis. Reescreva sem alterar essa quantidade e sem criar reforços.`;
    else if(existing&&hasForbiddenReinforcement(text))violation=`A cena possui ${existing} hostis estabelecidos. Reescreva sem materializar novos inimigos ou reforços.`;
    else if(looksTruncated(text))violation='A resposta parece truncada. Reescreva a mesma resposta de forma completa e termine em uma frase concluída.';
    if(violation){const retry={...body,action:`CORREÇÃO OBRIGATÓRIA: ${violation} Não acrescente novos fatos. `+masterDirective(action)};const rr=await nativeFetch(input,{...init,body:JSON.stringify(retry)});try{const rd=await rr.clone().json(),rt=String(rd?.reply??rd?.text??'');const retryBad=(action.deterministic&&rollMarker(rt))||(action.requiresRoll&&!rollMarker(rt))||outcomeBeforeRoll(rt)||hasAmmoContradiction(rt,snapshot)||(existing&&countFromText(rt)&&countFromText(rt)!==existing);if(rt&&!retryBad){res=rr;data=rd;text=rt}else if(action.deterministic){data=replaceFields(data,deterministicFallback(action.type));res=jsonResponse(res,data)}}catch{if(action.deterministic){data=replaceFields(data,deterministicFallback(action.type));res=jsonResponse(res,data)}}}
    const parsedFinal=await res.clone().json(),finalText=String(parsedFinal?.reply??parsedFinal?.text??text);if(!existing){const n=countFromText(finalText);if(n)setEncounterCount(n)}
    if(finalText.includes('[[QUEST_COMPLETE]]')){try{await window.ValeDouroCampaign?.completeCurrent?.()}catch(e){console.warn('Conclusão de Quest não aplicada',e)}const clean=finalText.replace(/\s*\[\[QUEST_COMPLETE\]\]\s*/g,' ').trim(),d2=await res.clone().json();res=jsonResponse(res,replaceFields(d2,clean))}
  }catch(e){console.warn('Motor autoritativo: validação de resposta não aplicada',e)}return res
};

const originalAct=window.act;
if(typeof originalAct==='function')window.act=async function(){const raw=declaredPlayerText(),a=classifyAction(raw),c=activeCharacter();if(a.type==='ranged_attack'){const ammo=ammoItem(c);if(!ammo||ammo.qty<=0){addStory('<b>Sistema:</b> Não há munição disponível no inventário para realizar esse disparo.','system');return}const ok=window.ValeInventory?.consume?.(c,ammo.id,1);if(!ok){addStory('<b>Sistema:</b> A munição não pôde ser consumida; o disparo não foi executado.','system');return}}if(a.deterministic)applyDeterministicState(a);return originalAct.apply(this,arguments)};

window.addEventListener('valedouro:quest-complete',()=>{const s=auth();s.encounters={};s.rolls={};save(s)});
window.ValeAuthority={read:auth,snapshot:authoritativeSnapshot,classifyAction,secureDie,reset(){localStorage.removeItem(KEY)},diceLog(){try{return JSON.parse(localStorage.getItem(DICE_KEY)||'[]')}catch{return []}},auditDice(n=10000,sides=20){n=Math.max(100,Math.min(200000,Number(n)||10000));const counts=Array(sides).fill(0);for(let i=0;i<n;i++)counts[secureDie(sides)-1]++;const expected=n/sides;return {n,sides,expected,counts,min:Math.min(...counts),max:Math.max(...counts),spread:(Math.max(...counts)-Math.min(...counts))/expected}}};
})();
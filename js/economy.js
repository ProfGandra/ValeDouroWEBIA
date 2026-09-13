// ValeDouro WEBIA — Economia autoritativa: Ouro, Prata, Cobre e escambo
(function(){
'use strict';
if(window.__VALE_ECONOMY__) return;
window.__VALE_ECONOMY__=true;

const LEDGER_KEY='valedouro.economy.ledger.v1';
const EVENT_KEY='valedouro.economy.events.v1';
const nativeFetch=window.fetch.bind(window);
const esc=s=>window.esc?window.esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const charKey=c=>`${c?.name||'personagem'}|${c?.cls||''}`;
const activeCharacter=()=>window.state?.characters?.[window.state?.active||0]||null;

function invApi(){return window.ValeInventory||null}
function wallet(c=activeCharacter()){
  const api=invApi();
  if(!api||!c)return {gold:0,silver:0,copper:0,totalCopper:0};
  const coins=api.ensure(c)?.coins||{};
  const gold=Math.max(0,Number(coins.gold)||0),silver=Math.max(0,Number(coins.silver)||0),copper=Math.max(0,Number(coins.copper)||0);
  return {gold,silver,copper,totalCopper:gold*100+silver*10+copper};
}
function formatCoins(coins,compact=false){
  const c=coins?.totalCopper==null?{...coins,totalCopper:(coins?.gold||0)*100+(coins?.silver||0)*10+(coins?.copper||0)}:coins;
  if(compact)return `${c.gold||0} O · ${c.silver||0} P · ${c.copper||0} C`;
  return `${c.gold||0} ouro • ${c.silver||0} prata • ${c.copper||0} cobre`;
}
function amountText(totalCopper){
  let n=Math.max(0,Math.floor(Number(totalCopper)||0));
  const g=Math.floor(n/100);n%=100;const s=Math.floor(n/10),c=n%10;
  const parts=[];
  if(g)parts.push(`${g} moeda${g===1?'':'s'} de ouro`);
  if(s)parts.push(`${s} moeda${s===1?'':'s'} de prata`);
  if(c)parts.push(`${c} moeda${c===1?'':'s'} de cobre`);
  return parts.length?parts.join(', '):'nenhuma moeda';
}
function loadJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
function ledger(){const x=loadJson(LEDGER_KEY,{});return x&&typeof x==='object'?x:{}}
function saveLedger(x){localStorage.setItem(LEDGER_KEY,JSON.stringify(x))}
function record(c,type,data={}){
  if(!c)return;
  const db=ledger(),k=charKey(c);db[k]=Array.isArray(db[k])?db[k]:[];
  db[k].unshift({at:new Date().toISOString(),type,...data,balance:wallet(c)});
  db[k]=db[k].slice(0,250);saveLedger(db);
}
function eventSeen(id){if(!id)return false;return loadJson(EVENT_KEY,[]).includes(id)}
function markEvent(id){if(!id)return;const a=loadJson(EVENT_KEY,[]);a.push(id);localStorage.setItem(EVENT_KEY,JSON.stringify([...new Set(a)].slice(-500)))}

function ensureHud(){
  let hud=document.getElementById('valeMoneyHud');
  if(hud)return hud;
  const active=document.getElementById('activeName');
  const row=active?.closest('.row');
  if(!row)return null;
  hud=document.createElement('span');hud.id='valeMoneyHud';hud.className='vale-money-hud';hud.title='Bolsa do personagem ativo';
  row.appendChild(hud);
  if(!document.getElementById('valeEconomyStyle')){
    const st=document.createElement('style');st.id='valeEconomyStyle';st.textContent=`
      .vale-money-hud{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border:1px solid rgba(215,178,93,.35);border-radius:999px;background:rgba(74,52,25,.28);color:#ead39a;font-size:12px;white-space:nowrap;transition:.22s ease}
      .vale-money-hud::before{content:'🪙';font-size:13px}.vale-money-hud.flash-plus{transform:scale(1.06);box-shadow:0 0 0 2px rgba(194,158,78,.18),0 0 18px rgba(226,190,102,.35)}
      .vale-money-hud.flash-minus{transform:scale(.97);opacity:.78}.vale-money-delta{margin-left:4px;font-weight:800}.vale-money-delta.plus{color:#d9efa8}.vale-money-delta.minus{color:#f0c1ae}
      @media(max-width:760px){.vale-money-hud{font-size:11px;padding:2px 6px}}
    `;document.head.appendChild(st);
  }
  return hud;
}
function renderHud(){
  const hud=ensureHud(),c=activeCharacter();if(!hud)return;
  if(!c){hud.textContent='—';return}
  hud.textContent=formatCoins(wallet(c),true);hud.title=`Bolsa de ${c.name}: ${formatCoins(wallet(c))}`;
}
function flash(deltaCopper){
  const hud=ensureHud();if(!hud)return;renderHud();
  const cls=deltaCopper>=0?'flash-plus':'flash-minus';hud.classList.remove('flash-plus','flash-minus');void hud.offsetWidth;hud.classList.add(cls);
  if(deltaCopper){const d=document.createElement('span');d.className=`vale-money-delta ${deltaCopper>0?'plus':'minus'}`;d.textContent=`${deltaCopper>0?'+':'−'}${amountText(Math.abs(deltaCopper))}`;hud.appendChild(d)}
  setTimeout(()=>{hud.classList.remove(cls);renderHud()},2400);
}
function journalGain(c,copper,reason){
  if(!c||!reason||!(Number(copper)>0)||!window.ValeJournal?.addEntry)return false;
  const text=amountText(copper),safeReason=String(reason).trim();
  return !!window.ValeJournal.addEntry(c,{
    id:`money-gain-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    at:new Date().toISOString(),
    title:'Pagamento pelo trabalho',
    body:`Hoje consegui ${text} ${safeReason ? `por ${safeReason.replace(/^por\s+/i,'')}` : ''}.`.replace(/\s+\./g,'.'),
    learnings:[],illustration:null,source:'economy-confirmed',eventType:'money-gain'
  });
}
function journalBarter(c,reason,giveDesc,receiveDesc){
  if(!c||!reason||!window.ValeJournal?.addEntry)return false;
  return !!window.ValeJournal.addEntry(c,{id:`barter-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,at:new Date().toISOString(),title:'Um bom negócio',body:`Hoje fiz um acordo: ${giveDesc} em troca de ${receiveDesc}. ${String(reason).trim()}`.trim(),learnings:[],illustration:null,source:'economy-confirmed',eventType:'barter'});
}

function itemList(inv){return [...(inv?.items||[]),...(inv?.resources||[])]}
function findItem(inv,id){return itemList(inv).find(x=>x.id===id&&Number(x.qty||0)>0&&!['lost','abandoned'].includes(x.state))}
function validateBarter(c,e){
  const api=invApi();if(!api||!c)return {ok:false,reason:'no-character'};
  const inv=api.ensure(c),giveItems=Array.isArray(e.giveItems)?e.giveItems:[],giveCopper=Math.max(0,Number(e.giveCopper)||0);
  if(wallet(c).totalCopper<giveCopper)return {ok:false,reason:'funds'};
  for(const x of giveItems){const it=findItem(inv,x.id),q=Math.max(0,Number(x.qty)||0);if(!it||q<=0||Number(it.qty)<q)return {ok:false,reason:'items',itemId:x.id}}
  return {ok:true};
}
function barter(c,e={}){
  if(e.eventId&&eventSeen(e.eventId))return {ok:false,reason:'duplicate'};
  const api=invApi(),check=validateBarter(c,e);if(!check.ok)return check;
  const giveItems=Array.isArray(e.giveItems)?e.giveItems:[],receiveItems=Array.isArray(e.receiveItems)?e.receiveItems:[];
  const giveCopper=Math.max(0,Number(e.giveCopper)||0),receiveCopper=Math.max(0,Number(e.receiveCopper)||0);
  for(const x of giveItems)api.remove(c,x.id,Number(x.qty)||1,'bartered');
  if(giveCopper)api.pay(c,giveCopper);
  for(const x of receiveItems){const item=x.item||x;if(item?.id&&item?.name)api.add(c,{...item,qty:Number(item.qty||x.qty||1)});}
  if(receiveCopper)api.credit(c,receiveCopper);
  if(e.eventId)markEvent(e.eventId);
  const giveNames=[...giveItems.map(x=>`${x.qty||1}× ${x.name||x.id}`),...(giveCopper?[amountText(giveCopper)]:[])];
  const receiveNames=[...receiveItems.map(x=>{const it=x.item||x;return `${it.qty||x.qty||1}× ${it.name||it.id}`}),...(receiveCopper?[amountText(receiveCopper)]:[])];
  record(c,'barter',{reason:e.reason||'',giveItems,giveCopper,receiveItems,receiveCopper});
  if(e.journal===true||e.significant===true)journalBarter(c,e.reason||'O acordo ficou marcado na jornada.',giveNames.join(', ')||'um serviço/favor',receiveNames.join(', ')||'um serviço/favor');
  flash(receiveCopper-giveCopper);return {ok:true};
}
function credit(c,copper,reason='',opts={}){
  const api=invApi(),n=Math.max(0,Number(copper)||0);if(!api||!c||!n)return false;
  const ok=api.credit(c,n);if(!ok)return false;record(c,'credit',{copper:n,reason});
  if(opts.journal!==false&&reason)journalGain(c,n,reason);flash(n);return true;
}
function pay(c,copper,reason=''){
  const api=invApi(),n=Math.max(0,Number(copper)||0);if(!api||!c||!n)return false;
  const ok=api.pay(c,n);if(!ok)return false;record(c,'pay',{copper:n,reason});flash(-n);return true;
}
function publicState(){return (window.state?.characters||[]).map(c=>({name:c.name,...wallet(c)}))}
function history(c=activeCharacter()){return ledger()[charKey(c)]||[]}

function wrapInventoryEvents(){
  const api=invApi();if(!api){setTimeout(wrapInventoryEvents,120);return}
  if(api.applyEvent?.__vdEconomyWrapped)return;
  const previous=api.applyEvent;
  const wrapped=function(c,e){
    const before=wallet(c).totalCopper,result=previous.apply(this,arguments),after=wallet(c).totalCopper;
    if(result?.ok&&(e?.action==='credit'||e?.action==='pay')){
      const delta=after-before;
      record(c,e.action,{copper:Math.abs(delta),reason:e.reason||e.source||'',eventId:e.eventId||null});
      if(delta>0&&(e.journal===true||e.significant===true||!!e.reason))journalGain(c,delta,e.reason||e.source||'um pagamento recebido');
      flash(delta);
    }
    return result;
  };
  wrapped.__vdEconomyWrapped=true;api.applyEvent=wrapped;
}
function wrapInventoryUi(){
  if(typeof window.openInventory!=='function'){setTimeout(wrapInventoryUi,120);return}
  if(window.openInventory.__vdEconomyWrapped)return;
  const previous=window.openInventory;
  const wrapped=function(){const r=previous.apply(this,arguments);requestAnimationFrame(()=>{const box=document.getElementById('inventoryContent');if(box)box.innerHTML=box.innerHTML.replace('PO/PA/PC = 1:10:100.','Ouro/Prata/Cobre = 1:10:100.');});return r};
  wrapped.__vdEconomyWrapped=true;window.openInventory=wrapped;
}
function wrapCharacterSelection(){
  if(typeof window.selectPC==='function'&&!window.selectPC.__vdEconomyWrapped){const prev=window.selectPC;const w=function(){const r=prev.apply(this,arguments);renderHud();return r};w.__vdEconomyWrapped=true;window.selectPC=w;}
  if(typeof window.renderParty==='function'&&!window.renderParty.__vdEconomyWrapped){const prev=window.renderParty;const w=function(){const r=prev.apply(this,arguments);renderHud();return r};w.__vdEconomyWrapped=true;window.renderParty=w;}
}

function economyDirective(){return [
  'ECONOMIA AUTORITATIVA DE VALEDOURO — OBRIGATÓRIO.',
  'As únicas moedas são Ouro, Prata e Cobre. Conversão: 1 Ouro = 10 Pratas = 100 Cobres; 1 Prata = 10 Cobres.',
  'O saldo fornecido em state.economy é verdade absoluta. Nunca invente moedas nem permita gasto superior ao saldo.',
  'Uma oferta, promessa de recompensa ou preço citado NÃO altera o saldo.',
  'Somente depois de um pagamento realmente entregue/recebido em cena, emita um evento de inventário.',
  'Para ganho confirmado, acrescente [[INV:JSON_URI_ENCODED]] com JSON {"eventId":"id-unico","action":"credit","copper":VALOR_EM_COBRE,"reason":"descrição natural da origem","journal":true}.',
  'Para gasto confirmado, use {"eventId":"id-unico","action":"pay","copper":VALOR_EM_COBRE,"reason":"descrição da despesa"}.',
  'Escambo é permitido. Só conclua se o personagem realmente possuir o que oferece. Depois de acordo confirmado, use [[BARTER:JSON_URI_ENCODED]] com giveItems/receiveItems e, se necessário, giveCopper/receiveCopper. Pode combinar moedas e itens.',
  'Não exponha os marcadores técnicos ao jogador.'
].join(' ')}

window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||''),ai=(typeof window.AI_ENDPOINT!=='undefined'?window.AI_ENDPOINT:(typeof AI_ENDPOINT!=='undefined'?AI_ENDPOINT:null));
  if(!ai||url.replace(/\/$/,'')!==String(ai).replace(/\/$/,'')||String(init?.method||'GET').toUpperCase()!=='POST'||!init?.body)return nativeFetch(input,init);
  let nextInit=init;
  try{const b=JSON.parse(init.body);b.state={...(b.state||{}),economy:publicState()};b.world={...(b.world||{}),economy_policy:economyDirective()};nextInit={...init,body:JSON.stringify(b)}}catch(e){console.warn('Economia: contexto não injetado',e)}
  const res=await nativeFetch(input,nextInit);
  try{
    const data=await res.clone().json();let text=String(data?.text??data?.reply??''),changed=false;
    const re=/\s*\[\[BARTER:([^\]]+)\]\]\s*/gi;
    text=text.replace(re,(_,payload)=>{try{const e=JSON.parse(decodeURIComponent(payload));const idx=Number.isInteger(e.characterIndex)?e.characterIndex:(window.state?.active||0),c=window.state?.characters?.[idx];barter(c,e);changed=true}catch(err){console.warn('Evento de escambo inválido',err)}return ' '});
    if(changed){text=text.trim();const out={...data};if(typeof out.text==='string')out.text=text;if(typeof out.reply==='string')out.reply=text;const headers=new Headers(res.headers);headers.set('Content-Type','application/json; charset=utf-8');return new Response(JSON.stringify(out),{status:res.status,statusText:res.statusText,headers})}
  }catch(e){console.warn('Economia: resposta não pôde ser inspecionada',e)}
  return res;
};

window.addEventListener('valedouro:inventory-change',renderHud);
document.addEventListener('DOMContentLoaded',()=>{wrapCharacterSelection();renderHud()});
setTimeout(()=>{wrapInventoryEvents();wrapInventoryUi();wrapCharacterSelection();renderHud()},0);
setInterval(()=>{wrapCharacterSelection();renderHud()},2000);

window.ValeEconomy={wallet,formatCoins,amountText,credit,pay,barter,publicState,history,renderHud};
})();

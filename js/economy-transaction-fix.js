// ValeDouro WEBIA — correções de transações: valores acordados, marcadores INV e continuidade comercial
(function(){
'use strict';
if(window.__VALE_ECONOMY_TRANSACTION_FIX__)return;
window.__VALE_ECONOMY_TRANSACTION_FIX__=true;
const previousFetch=window.fetch.bind(window);
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
function aiEndpoint(){try{return typeof AI_ENDPOINT!=='undefined'?String(AI_ENDPOINT):''}catch{return ''}}
function isAi(url){return String(url||'').replace(/\/$/,'')===aiEndpoint().replace(/\/$/,'')}
function moneyToCopper(n,unit){n=Math.max(0,Number(n)||0);const u=norm(unit);if(/ouro/.test(u))return n*100;if(/prata/.test(u))return n*10;return n}
function recentAgreement(body){
  const h=Array.isArray(body?.history)?body.history:[],texts=[];
  for(let i=Math.max(0,h.length-12);i<h.length;i++)texts.push(String(h[i]?.content||''));
  texts.push(String(body?.action||''));
  for(let i=texts.length-1;i>=0;i--){
    const s=texts[i];
    const m=s.match(/\b(?:pago|pagarei|te pago|ofereco|ofereço|aceito pagar|cobro|custa|por)\s*(\d+)\s*(?:moeda(?:s)?\s+de\s+)?(ouro|prata|cobre)\b/i)||s.match(/\b(\d+)\s*(?:moeda(?:s)?\s+de\s+)?(ouro|prata|cobre)\b/i);
    if(m){
      const reason=(s.match(/\bpor\s+([^.!?\n]+)/i)?.[1]||'serviço acordado em cena').trim();
      return {copper:moneyToCopper(m[1],m[2]),reason,source:s};
    }
  }
  return null;
}
function transactionPolicy(body,agreement){
  const recent=(Array.isArray(body?.history)?body.history:[]).slice(-8).map(x=>x.content||'').join(' | ');
  return [
    'CONTINUIDADE DE TRANSAÇÃO — OBRIGATÓRIO.',
    'Se uma negociação ou serviço local estiver em andamento, preserve NPC, função, local, período do dia, objeto e termos até a conclusão explícita.',
    'Nunca transforme um aprendiz, comerciante, artesão ou prestador de serviço em companheiro de viagem, guia ou membro do grupo sem convite e aceitação explícitos.',
    'Não avance para estrada, missão, tarde/noite ou outro local enquanto o jogador ainda estiver resolvendo a negociação atual.',
    'O valor pago deve ser EXATAMENTE o valor acordado. 1 cobre = 1 cobre; jamais converta 1 cobre em 10 cobres.',
    agreement?`ACORDO MONETÁRIO RECENTE: ${agreement.copper} cobre(s), motivo: ${agreement.reason}.`:'Não há valor monetário explícito recente detectado.',
    `CONTEXTO RECENTE: ${recent}`
  ].join(' ');
}
function activeCharacter(idx){return window.state?.characters?.[Number.isInteger(idx)?idx:(window.state?.active||0)]||null}
function applyInvEvent(e,agreement){
  if(!e||!window.ValeInventory?.applyEvent)return false;
  const c=activeCharacter(e.characterIndex);if(!c)return false;
  const out={...e};
  if(out.action==='pay'&&agreement?.copper>0){out.copper=agreement.copper;if(!out.reason||/trilha|mapa|viagem|missao|missão/i.test(out.reason))out.reason=agreement.reason||'serviço acordado em cena'}
  return !!window.ValeInventory.applyEvent(c,out)?.ok;
}
window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  if(!isAi(url)||String(init?.method||'GET').toUpperCase()!=='POST'||!init?.body)return previousFetch(input,init);
  let body=null,agreement=null,nextInit=init;
  try{
    body=JSON.parse(init.body);agreement=recentAgreement(body);
    body.world={...(body.world||{}),transaction_continuity_policy:transactionPolicy(body,agreement)};
    body.state={...(body.state||{}),pending_transaction:agreement?{priceCopper:agreement.copper,reason:agreement.reason}:null};
    nextInit={...init,body:JSON.stringify(body)};
  }catch{}
  const res=await previousFetch(input,nextInit);
  try{
    const data=await res.clone().json();let text=String(data?.text??data?.reply??''),changed=false;
    const invRe=/\s*\[\[INV:([^\]]+)\]\]\s*/gi;
    text=text.replace(invRe,(_,payload)=>{try{const e=JSON.parse(decodeURIComponent(payload));applyInvEvent(e,agreement)}catch(err){console.warn('Evento INV inválido',err)}changed=true;return ' '});
    // Nunca deixe marcadores técnicos escaparem para a narrativa, mesmo se vierem malformados.
    text=text.replace(/\s*\[\[(?:INV|BARTER):[^\]]*\]\]\s*/gi,' ');
    if(changed||text!==String(data?.text??data?.reply??'')){
      text=text.replace(/\s{2,}/g,' ').replace(/\s+\n/g,'\n').trim();
      const out={...data};if(typeof out.text==='string')out.text=text;if(typeof out.reply==='string')out.reply=text;
      const headers=new Headers(res.headers);headers.set('Content-Type','application/json; charset=utf-8');
      return new Response(JSON.stringify(out),{status:res.status,statusText:res.statusText,headers});
    }
  }catch(e){console.warn('Correção econômica: resposta não inspecionada',e)}
  return res;
};
})();
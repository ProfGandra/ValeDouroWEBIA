(()=>{
'use strict';

const CATALOG_URL='data/ambience-map.json';
const MASTER_GAIN=0.82;
let catalog={ambiences:{},fx:{}};
let catalogPromise=null;
let unlocked=false;
let busy=false;
let musicRestoreVolume=null;
const active=new Set();

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const normalizeKey=v=>String(v||'').trim().toUpperCase();

async function loadCatalog(){
  if(catalogPromise)return catalogPromise;
  catalogPromise=(async()=>{
    try{
      const r=await fetch(CATALOG_URL,{cache:'no-store'});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const data=await r.json();
      if(!data||typeof data!=='object'||!data.fx)throw new Error('catálogo inválido');
      catalog=data;
    }catch(e){console.warn('Mapa de FX indisponível:',e);catalog={ambiences:{},fx:{}}}
    return catalog;
  })();
  return catalogPromise;
}

function audioState(){return window.ValeAudio?.getState?.()||{enabled:true,volume:.45}}
function actualGain(gain=1){
  const s=audioState();
  if(!s.enabled||s.volume<=0)return 0;
  return clamp(Math.pow(s.volume,2)*MASTER_GAIN*Number(gain||1),0,1);
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}

function tweenVolume(audio,to,duration=180){
  if(!audio)return;
  const from=Number(audio.volume||0),target=clamp(Number(to)||0,0,1),start=performance.now();
  const step=now=>{
    const p=Math.min(1,(now-start)/Math.max(1,duration));
    audio.volume=from+(target-from)*p;
    if(p<1)requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function duckMusic(factor=.2,duration=180){
  const p=window.ValeAudio?.player;if(!p)return;
  if(musicRestoreVolume===null)musicRestoreVolume=p.volume;
  tweenVolume(p,clamp(musicRestoreVolume*factor,0,1),duration);
}
function restoreMusic(duration=1200){
  const p=window.ValeAudio?.player;if(!p||musicRestoreVolume===null)return;
  const target=musicRestoreVolume;musicRestoreVolume=null;
  tweenVolume(p,target,duration);
}

function ensureOverlay(){
  let el=document.getElementById('valeFxOverlay');
  if(!el){el=document.createElement('div');el.id='valeFxOverlay';el.className='vale-fx-overlay';document.body.appendChild(el)}
  if(!document.getElementById('valeFxStyle')){
    const s=document.createElement('style');s.id='valeFxStyle';
    s.textContent='.vale-fx-overlay{position:fixed;inset:0;z-index:9996;pointer-events:none;opacity:0;background:#fff}.vale-fx-overlay.flash{animation:valeFxFlash .28s ease-out}.vale-fx-overlay.lightning{animation:valeFxLightning .18s ease-out}@keyframes valeFxFlash{0%{opacity:.95}35%{opacity:.7}100%{opacity:0}}@keyframes valeFxLightning{0%{opacity:.9}25%{opacity:.15}45%{opacity:.75}100%{opacity:0}}.vale-fx-shake{animation:valeFxShake .72s cubic-bezier(.36,.07,.19,.97)}@keyframes valeFxShake{0%,100%{transform:translate(0,0)}10%{transform:translate(-7px,2px)}20%{transform:translate(6px,-3px)}30%{transform:translate(-5px,4px)}40%{transform:translate(5px,-2px)}50%{transform:translate(-4px,2px)}60%{transform:translate(3px,-2px)}70%{transform:translate(-2px,1px)}80%{transform:translate(2px,-1px)}90%{transform:translate(-1px,0)}}@media (prefers-reduced-motion: reduce){.vale-fx-shake{animation:none!important}.vale-fx-overlay.flash,.vale-fx-overlay.lightning{animation-duration:.08s!important}}';
    document.head.appendChild(s);
  }
  return el;
}

function flash(kind='flash'){
  const el=ensureOverlay();
  el.classList.remove('flash','lightning');
  void el.offsetWidth;
  el.classList.add(kind==='lightning'?'lightning':'flash');
  setTimeout(()=>el.classList.remove('flash','lightning'),420);
}
function shake(){
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const target=document.getElementById('game')||document.body;
  target.classList.remove('vale-fx-shake');void target.offsetWidth;target.classList.add('vale-fx-shake');
  setTimeout(()=>target.classList.remove('vale-fx-shake'),900);
}

async function playAudio(src,gain=1){
  if(!unlocked||!src||actualGain(gain)<=0)return null;
  const a=new Audio(src);a.preload='auto';a.volume=actualGain(gain);active.add(a);
  const cleanup=()=>active.delete(a);a.addEventListener('ended',cleanup,{once:true});a.addEventListener('error',cleanup,{once:true});
  try{await a.play();return a}catch(e){cleanup();console.warn('FX não pôde iniciar:',e);return null}
}

async function trigger(key){
  await loadCatalog();
  key=normalizeKey(key);
  const cfg=catalog.fx?.[key];if(!cfg)return false;
  if(key==='MARTELO_SAO_TELMO'&&busy)return false;
  if(key==='MARTELO_SAO_TELMO')busy=true;
  try{
    if(Number.isFinite(+cfg.duck))duckMusic(+cfg.duck,180);
    const shot=await playAudio(cfg.audio,cfg.gain);
    if(cfg.visual==='lightning')flash('lightning');
    if(cfg.visual==='martelo'){
      await sleep(70);
      flash('flash');
      shake();
    }
    if(cfg.impact?.audio){
      await sleep(Number(cfg.impact.delay_ms||0));
      await playAudio(cfg.impact.audio,cfg.impact.gain);
    }
    if(Number.isFinite(+cfg.restore_ms))setTimeout(()=>restoreMusic(Number(cfg.restore_ms||1200)),250);
    window.dispatchEvent(new CustomEvent('valedouro:fx',{detail:{key,label:cfg.label||key,shotStarted:!!shot}}));
    return true;
  }finally{
    if(key==='MARTELO_SAO_TELMO')setTimeout(()=>{busy=false},1200);
  }
}

function directive(){
  const keys=Object.keys(catalog.fx||{});
  return `EFEITOS ESPECIAIS: FX são raros e reservados a acontecimentos extraordinários. Chaves permitidas: ${keys.join(', ')}. Quando um desses acontecimentos realmente ocorrer, acrescente ao FINAL exatamente um marcador [[FX:CHAVE]]. Não use FX para ações comuns, chuva normal, portas, espadas, magia cotidiana ou ambientação rotineira. Não explique nem mencione o marcador ao jogador.`;
}

function installAIBridge(){
  if(window.__valeFxFetchInstalled)return;
  window.__valeFxFetchInstalled=true;
  const previousFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const aiUrl=(typeof AI_ENDPOINT!=='undefined'?AI_ENDPOINT:null);
    let nextInit=init;
    if(url===aiUrl&&init?.method==='POST'&&init.body){
      try{
        await loadCatalog();
        const b=JSON.parse(init.body),rule=directive();
        b.world={...(b.world||{}),fx_instruction:rule};
        b.state={...(b.state||{}),fxRules:[rule],capabilityRules:[...((b.state?.capabilityRules)||[]),rule]};
        nextInit={...init,body:JSON.stringify(b)};
      }catch(e){console.warn('Regra de FX não injetada',e)}
    }
    const res=await previousFetch(input,nextInit);
    if(url!==aiUrl)return res;
    try{
      await loadCatalog();
      const data=await res.clone().json();let changed=false,marker=null;
      for(const field of ['reply','text'])if(typeof data?.[field]==='string'){
        data[field]=data[field].replace(/\s*\[\[FX:([A-Z0-9_]+)\]\]\s*/gi,(_,key)=>{const k=normalizeKey(key);if(catalog.fx?.[k])marker=k;changed=true;return ' '}).trim();
      }
      if(marker)trigger(marker);
      if(changed){const headers=new Headers(res.headers);headers.set('Content-Type','application/json; charset=utf-8');return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers})}
    }catch(e){console.warn('Marcador de FX não processado',e)}
    return res;
  }
}

function unlock(){unlocked=true}
async function init(){await loadCatalog();ensureOverlay();installAIBridge();document.addEventListener('pointerdown',unlock,{once:true,capture:true});document.addEventListener('keydown',unlock,{once:true,capture:true})}

window.ValeFX={loadCatalog,trigger,getState:()=>({unlocked,busy,active:active.size})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

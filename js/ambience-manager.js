(()=>{
'use strict';

const CATALOG_URL='data/ambience-map.json';
const STORAGE_KEY='valedouro.ambience.v1';
const MASTER_GAIN=0.42;
let catalog={ambiences:{},fx:{}};
let catalogPromise=null;
let currentKey='NONE';
let unlocked=false;
const players=new Map();

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const normalizeKey=v=>String(v||'').trim().toUpperCase();

async function loadCatalog(){
  if(catalogPromise)return catalogPromise;
  catalogPromise=(async()=>{
    try{
      const r=await fetch(CATALOG_URL,{cache:'no-store'});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const data=await r.json();
      if(!data||typeof data!=='object'||!data.ambiences)throw new Error('catálogo inválido');
      catalog=data;
    }catch(e){console.warn('Mapa de ambience indisponível:',e);catalog={ambiences:{},fx:{}}}
    return catalog;
  })();
  return catalogPromise;
}

function audioState(){return window.ValeAudio?.getState?.()||{enabled:true,volume:.45}}
function actualGain(layerGain=1){
  const s=audioState();
  if(!s.enabled||s.volume<=0)return 0;
  return clamp(Math.pow(s.volume,2)*MASTER_GAIN*Number(layerGain||1),0,1);
}
function ambience(key){return catalog?.ambiences?.[normalizeKey(key)]||null}
function layerById(id){return players.get(id)||null}

function syncVolumes(){for(const entry of players.values())entry.audio.volume=actualGain(entry.gain)}

async function ensureEntry(layer){
  let entry=layerById(layer.id);
  if(!entry){
    const audio=new Audio();
    audio.preload='auto';audio.src=layer.src;audio.loop=layer.loop!==false;
    entry={audio,gain:Number(layer.gain||1),src:layer.src};players.set(layer.id,entry);
  }
  entry.gain=Number(layer.gain||1);
  if(entry.src!==layer.src){entry.audio.pause();entry.audio.src=layer.src;entry.audio.currentTime=0;entry.src=layer.src}
  entry.audio.volume=actualGain(entry.gain);
  return entry;
}

async function apply(key){
  await loadCatalog();
  key=normalizeKey(key||'NONE');
  const cfg=ambience(key);if(!cfg)return false;
  currentKey=key;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({currentKey:key}))}catch{}
  const wanted=new Set((cfg.layers||[]).map(x=>x.id));
  for(const [id,entry] of players){if(!wanted.has(id)){entry.audio.pause();entry.audio.currentTime=0;players.delete(id)}}
  for(const layer of cfg.layers||[]){
    const entry=await ensureEntry(layer);
    if(unlocked&&audioState().enabled&&audioState().volume>0){try{await entry.audio.play()}catch(e){console.warn('Ambience não pôde iniciar:',e)}}
  }
  window.dispatchEvent(new CustomEvent('valedouro:ambience-change',{detail:{key,label:cfg.label||key}}));
  return true;
}

function stop(){return apply('NONE')}
function unlock(){unlocked=true;for(const entry of players.values())if(audioState().enabled&&audioState().volume>0)entry.audio.play().catch(()=>{})}
function directive(){
  const keys=Object.keys(catalog.ambiences||{}).filter(k=>k!=='NONE');
  return `AMBIENTAÇÃO SONORA: use ambience apenas quando o local/clima realmente mudar. Estados permitidos: ${keys.join(', ')}. Quando mudar, acrescente ao FINAL exatamente um marcador [[AMBIENCE:CHAVE]]. Use [[AMBIENCE:NONE]] quando a cena deixar de ter ambience adicional. Não explique nem mencione o marcador ao jogador.`;
}

function installAIBridge(){
  if(window.__valeAmbienceFetchInstalled)return;
  window.__valeAmbienceFetchInstalled=true;
  const previousFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const aiUrl=(typeof AI_ENDPOINT!=='undefined'?AI_ENDPOINT:null);
    let nextInit=init;
    if(url===aiUrl&&init?.method==='POST'&&init.body){
      try{
        await loadCatalog();
        const b=JSON.parse(init.body),rule=directive();
        b.world={...(b.world||{}),ambience_instruction:rule};
        b.state={...(b.state||{}),ambience:{currentKey},ambienceRules:[rule],capabilityRules:[...((b.state?.capabilityRules)||[]),rule]};
        nextInit={...init,body:JSON.stringify(b)};
      }catch(e){console.warn('Regra de ambience não injetada',e)}
    }
    const res=await previousFetch(input,nextInit);
    if(url!==aiUrl)return res;
    try{
      await loadCatalog();
      const data=await res.clone().json();let changed=false,marker=null;
      for(const field of ['reply','text'])if(typeof data?.[field]==='string'){
        data[field]=data[field].replace(/\s*\[\[AMBIENCE:([A-Z0-9_]+)\]\]\s*/gi,(_,key)=>{const k=normalizeKey(key);if(catalog.ambiences?.[k])marker=k;changed=true;return ' '}).trim();
      }
      if(marker)await apply(marker);
      if(changed){const headers=new Headers(res.headers);headers.set('Content-Type','application/json; charset=utf-8');return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers})}
    }catch(e){console.warn('Marcador de ambience não processado',e)}
    return res;
  }
}

function watchAudioSettings(){setInterval(()=>syncVolumes(),500)}
function loadSeasonGate(){
  if(document.getElementById('valeSeasonGateScript')||window.ValeSeasonGate)return;
  const s=document.createElement('script');s.id='valeSeasonGateScript';s.src='js/season-gate.js?v=20260906-1';s.defer=true;document.head.appendChild(s);
}

async function init(){
  await loadCatalog();installAIBridge();watchAudioSettings();loadSeasonGate();
  document.addEventListener('pointerdown',unlock,{once:true,capture:true});
  document.addEventListener('keydown',unlock,{once:true,capture:true});
}

window.ValeAmbience={loadCatalog,apply,stop,getState:()=>({currentKey,unlocked,layers:[...players.keys()]})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

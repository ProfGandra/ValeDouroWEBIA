(()=>{
'use strict';

const STORAGE_KEY='valedouro.audio.v1';
const BASE='assets/audio/music/';
const FADE_MS=1300;

const TRACKS={
  exploration:{src:BASE+'VD_EXPLORATION_01.mp3',label:'Exploração',loop:true},
  market:{src:BASE+'VD_MARKET_01.mp3',label:'Mercado / cidade',loop:true},
  tavern:{src:BASE+'VD_TAVERN_01.mp3',label:'Taverna',loop:true},
  court:{src:BASE+'VD_COURT_01.mp3',label:'Corte / castelo',loop:true},
  bard:{src:BASE+'VD_BARD_01.mp3',label:'Bardo / cena social',loop:true},
  rejoicing:{src:BASE+'VD_REJOICING_01.mp3',label:'Celebração',loop:true},
  camp:{src:BASE+'VD_CAMP_01.mp3',label:'Acampamento',loop:true},
  mystery:{src:BASE+'VD_MYSTERY_01.ogg',label:'Mistério / investigação',loop:true},
  tension:{src:BASE+'VD_TENSION_01.ogg',label:'Tensão / perigo',loop:true},
  dungeon:{src:BASE+'VD_DUNGEON_01.ogg',label:'Dungeon / subterrâneo',loop:true},
  sea:{src:BASE+'VD_SEA_01.ogg',label:'Mar / navegação',loop:true},
  battle_intro:{src:BASE+'VD_BATTLE_INTRO_01.mp3',label:'Combate iminente',loop:false,next:'battle_loop'},
  battle_loop:{src:BASE+'VD_BATTLE_LOOP_01.wav',label:'Combate',loop:true},
  battle_aftermath:{src:BASE+'VD_BATTLE_AFTERMATH_01.mp3',label:'Pós-combate',loop:true}
};

const VALID_KEYS=Object.keys(TRACKS);
let settings=readSettings();
let currentKey=null;
let activeSlot=0;
let unlocked=false;
let fadingToken=0;
const slots=[makeAudio(),makeAudio()];
const preloaders=new Map();

function makeAudio(){const a=new Audio();a.preload='auto';a.volume=0;return a}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function readSettings(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');return {enabled:s.enabled!==false,volume:clamp(Number.isFinite(+s.volume)?+s.volume:.45,0,1)}}catch{return {enabled:true,volume:.45}}}
function saveSettings(){localStorage.setItem(STORAGE_KEY,JSON.stringify(settings))}
function normalizeKey(v){return String(v||'').trim().toLowerCase()}
function track(k){return TRACKS[normalizeKey(k)]||null}
function isPlaying(a){return !!a&&!a.paused&&!a.ended}

function preload(key){const t=track(key);if(!t||preloaders.has(key))return;const a=new Audio();a.preload='auto';a.src=t.src;try{a.load()}catch{}preloaders.set(key,a)}

function fadeVolumes(incoming,outgoing,duration=FADE_MS){
  const token=++fadingToken,start=performance.now();
  const target=settings.enabled?settings.volume:0;
  const outStart=outgoing?.volume||0;
  function step(now){
    if(token!==fadingToken)return;
    const p=clamp((now-start)/duration,0,1);
    if(incoming)incoming.volume=target*p;
    if(outgoing)outgoing.volume=outStart*(1-p);
    if(p<1)requestAnimationFrame(step);else if(outgoing){outgoing.pause();outgoing.currentTime=0;}
  }
  requestAnimationFrame(step);
}

async function play(key,opts={}){
  key=normalizeKey(key);const t=track(key);if(!t)return false;
  if(key===currentKey&&isPlaying(slots[activeSlot])){updateUI();return true}
  currentKey=key;updateUI();
  if(key==='battle_intro')preload('battle_loop');
  if(!settings.enabled||!unlocked)return true;

  const nextSlot=1-activeSlot,incoming=slots[nextSlot],outgoing=slots[activeSlot];
  incoming.pause();incoming.currentTime=0;incoming.src=t.src;incoming.loop=!!t.loop;incoming.volume=0;
  incoming.onended=()=>{if(t.next&&currentKey===key)play(t.next,{fromSequence:true})};
  try{
    await incoming.play();
    activeSlot=nextSlot;
    if(opts.immediate){++fadingToken;incoming.volume=settings.volume;if(outgoing){outgoing.pause();outgoing.currentTime=0;}}
    else fadeVolumes(incoming,outgoing);
    updateUI();return true;
  }catch(err){console.warn('Trilha não pôde iniciar automaticamente:',err);updateUI('Clique em Som ambiente para iniciar');return false}
}

function stop({clear=false}={}){++fadingToken;slots.forEach(a=>{a.pause();a.currentTime=0;a.volume=0});if(clear)currentKey=null;updateUI()}
function pause(){++fadingToken;slots.forEach(a=>a.pause());updateUI()}
function resume(){unlocked=true;if(currentKey)return play(currentKey,{immediate:true});updateUI();return Promise.resolve(true)}
function setVolume(value){settings.volume=clamp(+value,0,1);saveSettings();const a=slots[activeSlot];if(isPlaying(a))a.volume=settings.volume;updateUI()}
function setEnabled(value){settings.enabled=!!value;saveSettings();unlocked=true;if(settings.enabled){if(currentKey)play(currentKey,{immediate:true})}else pause();updateUI()}
function toggle(){setEnabled(!settings.enabled)}

function installUI(){
  if(document.getElementById('valeAudioControls'))return;
  const box=document.createElement('div');box.id='valeAudioControls';box.className='vale-audio-controls';
  box.innerHTML='<button id="valeAudioToggle" class="vale-audio-toggle" type="button" title="Ativar ou desativar a trilha sonora"><span id="valeAudioIcon">🔊</span><span class="vale-audio-text">Som ambiente</span></button><div class="vale-audio-volume"><input id="valeAudioVolume" type="range" min="0" max="100" step="1" aria-label="Volume da trilha sonora"><span id="valeAudioPercent"></span></div><div id="valeAudioNow" class="vale-audio-now">Trilha: aguardando cena</div>';
  document.body.appendChild(box);
  const style=document.createElement('style');style.id='valeAudioStyle';style.textContent='.vale-audio-controls{position:fixed;left:12px;bottom:118px;z-index:9997;width:224px;padding:9px 10px;border:1px solid rgba(201,164,92,.42);border-radius:12px;background:rgba(18,15,12,.88);backdrop-filter:blur(8px);box-shadow:0 5px 18px rgba(0,0,0,.32);color:#e9dfd0;font-size:11px}.vale-audio-toggle{width:100%;display:flex;align-items:center;gap:7px;border:0;background:transparent;color:inherit;font:inherit;font-weight:700;text-align:left;cursor:pointer;padding:1px 0 6px}.vale-audio-toggle:hover{color:#f0c875}.vale-audio-volume{display:flex;align-items:center;gap:7px}.vale-audio-volume input{flex:1;min-width:0;accent-color:#c9a45c}.vale-audio-volume span{width:34px;text-align:right;font-variant-numeric:tabular-nums;color:#cdbfae}.vale-audio-now{margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#a99d8c;font-size:10px}@media(max-width:800px){.vale-audio-controls{left:6px;bottom:94px;width:176px;padding:7px 8px}.vale-audio-text{font-size:10px}.vale-audio-now{display:none}}@media print{.vale-audio-controls{display:none!important}}';
  document.head.appendChild(style);
  document.getElementById('valeAudioToggle').addEventListener('click',toggle);
  document.getElementById('valeAudioVolume').addEventListener('input',e=>setVolume((+e.target.value||0)/100));
  updateUI();
}

function updateUI(note=''){
  const toggleEl=document.getElementById('valeAudioToggle'),icon=document.getElementById('valeAudioIcon'),range=document.getElementById('valeAudioVolume'),percent=document.getElementById('valeAudioPercent'),now=document.getElementById('valeAudioNow');
  if(!toggleEl)return;
  if(icon)icon.textContent=settings.enabled?'🔊':'🔇';
  toggleEl.setAttribute('aria-pressed',settings.enabled?'true':'false');
  if(range)range.value=Math.round(settings.volume*100);
  if(percent)percent.textContent=Math.round(settings.volume*100)+'%';
  if(now){const t=track(currentKey);now.textContent=note||('Trilha: '+(t?t.label:'aguardando cena'));now.title=now.textContent}
}

function normalizeText(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim()}
function inferFromNarrative(text){
  const t=normalizeText(text);if(!t)return null;
  const rules=[
    ['battle_aftermath',[/combate (?:terminou|acabou|cessou)/,/batalha (?:terminou|acabou|cessou)/,/perigo (?:passou|cessou)/,/ultimo (?:inimigo|adversario).{0,30}(?:cai|tomba)/,/agora.{0,45}(?:feridos|mortos|espolios)/]],
    ['battle_intro',[/role(?:m)? iniciativa/,/iniciativa!/,/combate (?:comeca|se inicia|e inevitavel)/,/preparam-se para (?:atacar|lutar)/]],
    ['tavern',[/\btaverna\b/,/\bestalagem\b/]],
    ['market',[/\bmercado\b/,/\bfeira\b/,/bancas de (?:mercadores|comerciantes)/]],
    ['court',[/sala do trono/,/\bcorte real\b/,/\bpalacio\b/,/audiencia real/]],
    ['sea',[/a bordo/,/\bnavio\b/,/\bmar\b/,/\bcais\b/,/\bporto\b/]],
    ['camp',[/\bacampamento\b/,/\bfogueira\b/,/montam acampamento/]],
    ['rejoicing',[/\bcelebracao\b/,/\bcomemoracao\b/,/\bfesta\b/]],
    ['bard',[/\bbardo\b/,/apresentacao musical/,/musicos? (?:toca|tocam)/]],
    ['dungeon',[/\bdungeon\b/,/\bsubterraneo\b/,/\bcaverna\b/,/galerias? subterraneas?/,/camara subterranea/]],
    ['mystery',[/\bmisterio\b/,/\benigma\b/,/investigacao/,/passagem secreta/,/inscricoes? antigas?/]],
    ['tension',[/tensao/,/ameaca iminente/,/algo esta errado/,/silencio inquietante/,/sinais de perigo/,/emboscada/]],
    ['exploration',[/\bestrada\b/,/\btrilha\b/,/\bviagem\b/,/seguem caminho/,/continuam a jornada/,/\bfloresta\b/]]
  ];
  for(const [key,patterns] of rules)if(patterns.some(r=>r.test(t)))return key;
  return null;
}

function audioDirective(){
  return 'TRILHA SONORA: controle apenas a música de fundo da sessão, sem efeitos sonoros. Quando o estado musical realmente mudar, acrescente ao FINAL da resposta exatamente um marcador [[AUDIO:CHAVE]]. Chaves permitidas: exploration, market, tavern, court, bard, rejoicing, camp, mystery, tension, dungeon, sea, battle_intro, battle_aftermath. Use tension quando há perigo crescente mas ainda não há combate. Quando o combate começar ou a iniciativa for pedida, use battle_intro; o cliente passa automaticamente para battle_loop quando a introdução terminar, portanto nunca envie battle_loop. Quando o combate terminar e começar a fase de feridos, mortos, espólios ou consequências imediatas, use battle_aftermath. Não repita marcador se a atmosfera musical não mudou. Não explique nem mencione o marcador ao jogador.';
}

function installAIBridge(){
  if(window.__valeAudioFetchInstalled)return;window.__valeAudioFetchInstalled=true;
  const previousFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const aiUrl=(typeof AI_ENDPOINT!=='undefined'?AI_ENDPOINT:null);
    let nextInit=init;
    if(url===aiUrl&&init?.method==='POST'&&init.body){
      try{const b=JSON.parse(init.body);const rule=audioDirective();b.world={...(b.world||{}),audio_instruction:rule};b.state={...(b.state||{}),audio:{currentKey},audioRules:[rule],capabilityRules:[...((b.state?.capabilityRules)||[]),rule]};nextInit={...init,body:JSON.stringify(b)}}catch(e){console.warn('Regra de áudio não injetada',e)}
    }
    const res=await previousFetch(input,nextInit);if(url!==aiUrl)return res;
    try{
      const data=await res.clone().json();let changed=false,marker=null,narrative='';
      for(const field of ['reply','text'])if(typeof data?.[field]==='string'){
        narrative+=' '+data[field];
        data[field]=data[field].replace(/\s*\[\[AUDIO:([A-Z0-9_]+)\]\]\s*/gi,(_,key)=>{const k=normalizeKey(key);if(TRACKS[k])marker=k;changed=true;return ' '}).trim();
      }
      const desired=marker||inferFromNarrative(narrative)||(currentKey?null:'exploration');if(desired)play(desired);
      if(changed){const headers=new Headers(res.headers);headers.set('Content-Type','application/json; charset=utf-8');return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers})}
    }catch(e){console.warn('Marcador de áudio não processado',e)}
    return res;
  };
}

function unlockFromGesture(){unlocked=true;if(settings.enabled&&currentKey&&!isPlaying(slots[activeSlot]))play(currentKey,{immediate:true})}
function init(){installUI();installAIBridge();document.addEventListener('pointerdown',unlockFromGesture,{once:true,capture:true});document.addEventListener('keydown',unlockFromGesture,{once:true,capture:true})}

window.ValeAudio={tracks:TRACKS,play,stop,pause,resume,toggle,setEnabled,setVolume,getState:()=>({enabled:settings.enabled,volume:settings.volume,currentKey,unlocked}),inferFromNarrative};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

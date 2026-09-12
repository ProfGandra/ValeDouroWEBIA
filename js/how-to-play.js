// ValeDouro WEBIA — Como Jogar integrado ao menu principal
(function(){
'use strict';
if(window.__VALE_HOW_TO_PLAY__) return;
window.__VALE_HOW_TO_PLAY__=true;

const MENU_V2='assets/valedouro-intro-v2.webp?v=20260912-3';

function ensureStyles(){
  if(document.getElementById('vd-howto-style')) return;
  const s=document.createElement('style');
  s.id='vd-howto-style';
  s.textContent=`
    /* Só aplica o novo layout depois que a nova arte foi realmente carregada. */
    #opening.vd-menu-v2 .intro-stage{width:min(100vw,calc(100vh * 1.6666667))!important;aspect-ratio:5/3!important;max-height:100vh!important}
    #opening.vd-menu-v2 .h-history{left:4.1%!important;top:34.8%!important;width:27.5%!important;height:9.2%!important}
    #opening.vd-menu-v2 .h-universe{left:4.1%!important;top:45.5%!important;width:27.5%!important;height:9.2%!important}
    #opening.vd-menu-v2 .h-chars{left:4.1%!important;top:56.2%!important;width:27.5%!important;height:9.2%!important}
    #opening.vd-menu-v2 .h-howto{left:4.1%!important;top:66.9%!important;width:27.5%!important;height:9.2%!important}
    #opening.vd-menu-v2 .h-new{left:4.1%!important;top:77.7%!important;width:27.5%!important;height:9.4%!important}
    .vd-howto-modal{position:fixed;inset:0;z-index:16000;display:none;background:rgba(6,5,4,.9);backdrop-filter:blur(5px)}
    .vd-howto-modal.active{display:flex;flex-direction:column}
    .vd-howto-top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid rgba(201,164,92,.35);background:#17120d;color:#eadfce}
    .vd-howto-top strong{color:#edc878}
    .vd-howto-frame{flex:1;width:100%;border:0;background:#120f0b}
    .vd-howto-fallback{position:absolute;left:50%;bottom:7.5%;transform:translateX(-50%);z-index:12;min-width:150px;padding:10px 18px;border:1px solid rgba(201,164,92,.72);border-radius:10px;background:rgba(19,15,11,.86);color:#efd38d;font-weight:800;cursor:pointer}
    @media(max-width:700px){.vd-howto-top{padding:8px 10px}}
  `;
  document.head.appendChild(s);
}

function openHowTo(){
  ensureModal();
  document.getElementById('vdHowToModal')?.classList.add('active');
  document.body.style.overflow='hidden';
}
function closeHowTo(){
  document.getElementById('vdHowToModal')?.classList.remove('active');
  document.body.style.overflow='';
}
function ensureModal(){
  if(document.getElementById('vdHowToModal')) return;
  const modal=document.createElement('div');
  modal.id='vdHowToModal';
  modal.className='vd-howto-modal';
  modal.innerHTML=`<div class="vd-howto-top"><strong>COMO JOGAR — VALEDOURO</strong><button class="btn" type="button" id="vdHowToClose">Voltar</button></div><iframe class="vd-howto-frame" src="how-to-play.html?v=20260912-1" title="Como Jogar — ValeDouro"></iframe>`;
  document.body.appendChild(modal);
  document.getElementById('vdHowToClose')?.addEventListener('click',closeHowTo);
  modal.addEventListener('click',e=>{if(e.target===modal)closeHowTo()});
}

function ensureFallbackButton(stage){
  if(stage.querySelector('.vd-howto-fallback')) return;
  const btn=document.createElement('button');
  btn.className='vd-howto-fallback';
  btn.type='button';
  btn.textContent='COMO JOGAR';
  btn.addEventListener('click',openHowTo);
  stage.appendChild(btn);
}

function ensureV2Hotspot(stage){
  if(stage.querySelector('.h-howto')) return;
  const btn=document.createElement('button');
  btn.className='hot h-howto';
  btn.type='button';
  btn.setAttribute('aria-label','Como jogar');
  btn.title='Como jogar';
  btn.addEventListener('click',openHowTo);
  const newGame=stage.querySelector('.h-new');
  if(newGame) stage.insertBefore(btn,newGame); else stage.appendChild(btn);
}

function activateV2(opening,stage,art){
  art.src=MENU_V2;
  art.alt='ValeDouro — Mestre Virtual';
  opening.classList.add('vd-menu-v2');
  stage.querySelector('.vd-howto-fallback')?.remove();
  ensureV2Hotspot(stage);
  const chars=stage.querySelector('.h-chars');
  if(chars){chars.setAttribute('aria-label','Suas fichas');chars.title='Suas fichas';}
}

function preloadMenuArt(opening,stage,art){
  if(opening.dataset.vdMenuArtState==='loading'||opening.dataset.vdMenuArtState==='ready') return;
  opening.dataset.vdMenuArtState='loading';
  const probe=new Image();
  probe.onload=()=>{opening.dataset.vdMenuArtState='ready';activateV2(opening,stage,art);};
  probe.onerror=()=>{
    opening.dataset.vdMenuArtState='fallback';
    opening.classList.remove('vd-menu-v2');
    ensureFallbackButton(stage);
    console.warn('ValeDouro: nova arte do menu ainda não está disponível; mantendo arte anterior.');
  };
  probe.src=MENU_V2;
}

function ensureMenu(){
  const opening=document.getElementById('opening');
  const stage=opening?.querySelector('.intro-stage');
  const art=stage?.querySelector('.intro-art');
  if(!opening||!stage||!art) return;
  preloadMenuArt(opening,stage,art);
  if(opening.dataset.vdMenuArtState==='ready') activateV2(opening,stage,art);
}

window.ValeHowToPlay={open:openHowTo,close:closeHowTo};
ensureStyles();
ensureModal();
ensureMenu();
const obs=new MutationObserver(()=>ensureMenu());
obs.observe(document.body,{childList:true,subtree:true});
})();

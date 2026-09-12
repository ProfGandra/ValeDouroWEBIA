// ValeDouro WEBIA — Como Jogar integrado ao menu principal
(function(){
'use strict';
if(window.__VALE_HOW_TO_PLAY__) return;
window.__VALE_HOW_TO_PLAY__=true;

const MENU_ART='assets/valedouro-menu-oficial.webp?v=20260912-12';
const VIEW_W=1656;
const VIEW_H=950;

function ensureStyles(){
  if(document.getElementById('vd-howto-style')) return;
  const s=document.createElement('style');
  s.id='vd-howto-style';
  s.textContent=`
    #opening .intro-stage{position:relative!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;aspect-ratio:auto!important;overflow:hidden!important}
    #opening .intro-art{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center center!important;display:block!important;opacity:1!important;visibility:visible!important}
    #opening .hot{pointer-events:none!important;opacity:0!important}
    #opening .vd-menu-overlay{position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none}
    #opening .vd-menu-overlay .vd-hot{fill:transparent;stroke:transparent;stroke-width:3;rx:8;ry:8;pointer-events:all;cursor:pointer;outline:none}
    #opening .vd-menu-overlay .vd-hot:hover,#opening .vd-menu-overlay .vd-hot:focus{fill:rgba(211,173,104,.05);stroke:rgba(226,197,143,.78);filter:drop-shadow(0 0 10px rgba(211,173,104,.35))}
    .vd-howto-modal{position:fixed;inset:0;z-index:16000;display:none;background:rgba(6,5,4,.9);backdrop-filter:blur(5px)}
    .vd-howto-modal.active{display:flex;flex-direction:column}
    .vd-howto-top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid rgba(201,164,92,.35);background:#17120d;color:#eadfce}
    .vd-howto-top strong{color:#edc878}
    .vd-howto-frame{flex:1;width:100%;border:0;background:#120f0b}
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

function ensureMenuArt(stage){
  const art=stage?.querySelector('.intro-art');
  if(!art) return;
  if(!(art.getAttribute('src')||'').includes('valedouro-menu-oficial.webp')){
    art.src=MENU_ART;
    art.alt='ValeDouro — Mestre Virtual';
  }
}

function ensureOverlay(stage){
  const old=stage.querySelector('.vd-menu-overlay');
  if(old) old.remove();
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('class','vd-menu-overlay');
  svg.setAttribute('viewBox',`0 0 ${VIEW_W} ${VIEW_H}`);
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.setAttribute('aria-label','Menu principal de ValeDouro');

  // Hotspots deliberadamente menores que as molduras douradas.
  // A margem interna evita sobreposição visual entre botões e mantém ícone/texto clicáveis.
  const items=[
    {x:82,y:355,w:412,h:70,label:'História',action:()=>window.show?.('history')},
    {x:82,y:459,w:412,h:69,label:'Universo',action:()=>window.show?.('universe')},
    {x:82,y:563,w:412,h:68,label:'Suas fichas',action:()=>window.showLibrary?.()},
    {x:82,y:666,w:412,h:70,label:'Como jogar',action:openHowTo},
    {x:82,y:770,w:412,h:71,label:'Novo jogo',action:()=>window.show?.('newgame')}
  ];

  items.forEach(item=>{
    const r=document.createElementNS(ns,'rect');
    r.setAttribute('class','vd-hot');
    r.setAttribute('x',item.x);
    r.setAttribute('y',item.y);
    r.setAttribute('width',item.w);
    r.setAttribute('height',item.h);
    r.setAttribute('tabindex','0');
    r.setAttribute('role','button');
    r.setAttribute('aria-label',item.label);
    r.addEventListener('click',item.action);
    r.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();item.action();}});
    svg.appendChild(r);
  });

  stage.appendChild(svg);
}

function ensureMenu(){
  const stage=document.querySelector('#opening .intro-stage');
  if(!stage) return;
  ensureMenuArt(stage);
  if(stage.dataset.vdOverlayVersion!=='12'){
    stage.dataset.vdOverlayVersion='12';
    ensureOverlay(stage);
  }
}

window.ValeHowToPlay={open:openHowTo,close:closeHowTo};
ensureStyles();
ensureModal();
ensureMenu();
new MutationObserver(ensureMenu).observe(document.body,{childList:true,subtree:true});
})();

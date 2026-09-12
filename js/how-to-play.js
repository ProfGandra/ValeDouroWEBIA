// ValeDouro WEBIA — Como Jogar integrado ao menu principal
(function(){
'use strict';
if(window.__VALE_HOW_TO_PLAY__) return;
window.__VALE_HOW_TO_PLAY__=true;

const MENU_ART='assets/valedouro-menu-oficial.webp?v=20260912-9';
const MENU_RATIO=1656/950;

function ensureStyles(){
  if(document.getElementById('vd-howto-style')) return;
  const s=document.createElement('style');
  s.id='vd-howto-style';
  s.textContent=`
    #opening .intro-stage{
      position:relative!important;
      width:min(100vw,calc(100vh * ${MENU_RATIO}))!important;
      aspect-ratio:1656/950!important;
      max-height:100vh!important;
    }
    #opening .intro-art{
      position:absolute!important;
      inset:0!important;
      display:block!important;
      opacity:1!important;
      visibility:visible!important;
      width:100%!important;
      height:100%!important;
      object-fit:contain!important;
    }

    /* Hotspots calculados diretamente sobre a arte oficial 1656 x 950. */
    #opening .h-history{left:4.11%!important;top:35.26%!important;width:26.39%!important;height:9.47%!important}
    #opening .h-universe{left:4.11%!important;top:45.79%!important;width:26.39%!important;height:9.58%!important}
    #opening .h-chars{left:4.11%!important;top:56.84%!important;width:26.39%!important;height:9.47%!important}
    #opening .h-howto{left:4.11%!important;top:67.79%!important;width:26.39%!important;height:9.47%!important}
    #opening .h-new{left:4.11%!important;top:78.74%!important;width:26.39%!important;height:9.79%!important}

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

function ensureMenuHotspot(stage){
  const chars=stage.querySelector('.h-chars');
  if(chars){chars.setAttribute('aria-label','Suas fichas');chars.title='Suas fichas';}
  if(!stage.querySelector('.h-howto')){
    const btn=document.createElement('button');
    btn.className='hot h-howto';
    btn.type='button';
    btn.setAttribute('aria-label','Como jogar');
    btn.title='Como jogar';
    btn.addEventListener('click',openHowTo);
    const newGame=stage.querySelector('.h-new');
    if(newGame) stage.insertBefore(btn,newGame); else stage.appendChild(btn);
  }
}

function ensureMenuArt(){
  const stage=document.querySelector('#opening .intro-stage');
  const art=stage?.querySelector('.intro-art');
  if(!stage||!art) return;
  ensureMenuHotspot(stage);

  // A arte oficial passa a ser a fonte única do menu.
  if(!(art.getAttribute('src')||'').includes('valedouro-menu-oficial.webp')){
    art.src=MENU_ART;
    art.alt='ValeDouro — Mestre Virtual';
  }
}

window.ValeHowToPlay={open:openHowTo,close:closeHowTo};
ensureStyles();
ensureModal();
ensureMenuArt();
new MutationObserver(ensureMenuArt).observe(document.body,{childList:true,subtree:true});
})();

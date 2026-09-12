// ValeDouro WEBIA — Como Jogar integrado ao menu principal
(function(){
'use strict';
if(window.__VALE_HOW_TO_PLAY__) return;
window.__VALE_HOW_TO_PLAY__=true;

const MENU_ART='assets/valedouro-menu-oficial.webp?v=20260912-23';
const MENU_RATIO=1600/900;
const CALIBRATION_MODE=true;

function ensureStyles(){
  if(document.getElementById('vd-howto-style')) return;
  const s=document.createElement('style');
  s.id='vd-howto-style';
  s.textContent=`
    #opening{align-items:center!important;justify-content:center!important;overflow:hidden!important}
    #opening .intro-stage{position:relative!important;width:min(100vw,calc(100vh * ${MENU_RATIO}))!important;height:auto!important;aspect-ratio:1600/900!important;max-width:100vw!important;max-height:100vh!important;overflow:visible!important}
    #opening .intro-art{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:fill!important;object-position:center!important;display:block!important;opacity:1!important;visibility:visible!important}
    #opening .vd-menu-overlay{display:none!important;pointer-events:none!important}

    #opening .hot{position:absolute!important;z-index:6!important;display:block!important;opacity:1!important;pointer-events:auto!important;background:transparent!important;border:0!important;border-radius:10px!important;cursor:pointer!important;box-sizing:border-box!important}
    #opening .hot:hover,#opening .hot:focus{box-shadow:0 0 0 2px rgba(226,197,143,.95),0 0 26px rgba(211,173,104,.45)!important;background:rgba(211,173,104,.08)!important;outline:none!important}

    /* Calibração v23. Como Jogar passa a ser a referência vertical validada.
       Reduzimos somente sua margem direita. Os demais hotspots foram refinados
       individualmente para acompanhar as molduras da arte oficial. */
    #opening .h-history {left:4.25%!important;top:35.20%!important;width:26.55%!important;height:11.45%!important}
    #opening .h-universe{left:4.25%!important;top:46.05%!important;width:26.55%!important;height:11.90%!important}
    #opening .h-chars   {left:4.25%!important;top:57.20%!important;width:26.55%!important;height:12.00%!important}
    #opening .h-howto   {left:4.25%!important;top:68.66%!important;width:26.55%!important;height:11.98%!important}
    #opening .h-new     {left:4.25%!important;top:79.75%!important;width:26.55%!important;height:12.35%!important}

    #opening.vd-calibration .hot{outline:3px dashed rgba(255,220,120,.95)!important;outline-offset:-3px!important;background:rgba(255,220,120,.10)!important}
    #opening.vd-calibration .hot::after{content:attr(aria-label);position:absolute;left:8px;top:6px;padding:2px 6px;border-radius:4px;background:rgba(0,0,0,.72);color:#fff4cf;font:700 11px/1.2 Arial,sans-serif;letter-spacing:.02em;pointer-events:none;white-space:nowrap}

    .vd-howto-modal{position:fixed;inset:0;z-index:16000;display:none;background:rgba(6,5,4,.9);backdrop-filter:blur(5px)}
    .vd-howto-modal.active{display:flex;flex-direction:column}
    .vd-howto-top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid rgba(201,164,92,.35);background:#17120d;color:#eadfce}
    .vd-howto-top strong{color:#edc878}
    .vd-howto-frame{flex:1;width:100%;border:0;background:#120f0b}
    @media(max-width:700px){.vd-howto-top{padding:8px 10px}}
  `;
  document.head.appendChild(s);
}
function openHowTo(){ensureModal();document.getElementById('vdHowToModal')?.classList.add('active');document.body.style.overflow='hidden'}
function closeHowTo(){document.getElementById('vdHowToModal')?.classList.remove('active');document.body.style.overflow=''}
function ensureModal(){if(document.getElementById('vdHowToModal'))return;const modal=document.createElement('div');modal.id='vdHowToModal';modal.className='vd-howto-modal';modal.innerHTML=`<div class="vd-howto-top"><strong>COMO JOGAR — VALEDOURO</strong><button class="btn" type="button" id="vdHowToClose">Voltar</button></div><iframe class="vd-howto-frame" src="how-to-play.html?v=20260912-1" title="Como Jogar — ValeDouro"></iframe>`;document.body.appendChild(modal);document.getElementById('vdHowToClose')?.addEventListener('click',closeHowTo);modal.addEventListener('click',e=>{if(e.target===modal)closeHowTo()})}
function ensureMenu(){
  const opening=document.getElementById('opening');
  const stage=document.querySelector('#opening .intro-stage');
  const art=stage?.querySelector('.intro-art');
  if(!stage||!art)return;
  if(!(art.getAttribute('src')||'').includes('valedouro-menu-oficial.webp')){art.src=MENU_ART;art.alt='ValeDouro — Mestre Virtual'}
  stage.querySelectorAll('.vd-menu-overlay').forEach(el=>el.remove());
  const chars=stage.querySelector('.h-chars');if(chars){chars.setAttribute('aria-label','Suas fichas');chars.title='Suas fichas'}
  if(!stage.querySelector('.h-howto')){const btn=document.createElement('button');btn.className='hot h-howto';btn.type='button';btn.setAttribute('aria-label','Como jogar');btn.title='Como jogar';btn.addEventListener('click',openHowTo);const newGame=stage.querySelector('.h-new');if(newGame)stage.insertBefore(btn,newGame);else stage.appendChild(btn)}
  const howTo=stage.querySelector('.h-howto');if(howTo&&!howTo.dataset.vdBound){howTo.dataset.vdBound='1';howTo.addEventListener('click',openHowTo)}
  if(opening) opening.classList.toggle('vd-calibration',CALIBRATION_MODE);
}
window.ValeHowToPlay={open:openHowTo,close:closeHowTo};ensureStyles();ensureModal();ensureMenu();new MutationObserver(ensureMenu).observe(document.body,{childList:true,subtree:true});
})();

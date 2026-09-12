// ValeDouro WEBIA — Como Jogar integrado ao menu principal
(function(){
'use strict';
if(window.__VALE_HOW_TO_PLAY__) return;
window.__VALE_HOW_TO_PLAY__=true;

function ensureStyles(){
  if(document.getElementById('vd-howto-style')) return;
  const s=document.createElement('style');
  s.id='vd-howto-style';
  s.textContent=`
    /* A nova arte do menu usa proporção 5:3 e cinco áreas clicáveis na coluna esquerda. */
    #opening .intro-stage{width:min(100vw,calc(100vh * 1.6666667))!important;aspect-ratio:5/3!important;max-height:100vh!important}
    #opening .h-history{left:4.1%!important;top:34.8%!important;width:27.5%!important;height:9.2%!important}
    #opening .h-universe{left:4.1%!important;top:45.5%!important;width:27.5%!important;height:9.2%!important}
    #opening .h-chars{left:4.1%!important;top:56.2%!important;width:27.5%!important;height:9.2%!important}
    #opening .h-howto{left:4.1%!important;top:66.9%!important;width:27.5%!important;height:9.2%!important}
    #opening .h-new{left:4.1%!important;top:77.7%!important;width:27.5%!important;height:9.4%!important}
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

function ensureMenu(){
  const opening=document.getElementById('opening');
  const stage=opening?.querySelector('.intro-stage');
  if(!stage) return;

  const art=stage.querySelector('.intro-art');
  if(art && !String(art.src).includes('valedouro-intro-v2.webp')){
    art.src='assets/valedouro-intro-v2.webp?v=20260912-2';
    art.alt='ValeDouro — Mestre Virtual';
  }

  const chars=stage.querySelector('.h-chars');
  if(chars){
    chars.setAttribute('aria-label','Suas fichas');
    chars.title='Suas fichas';
  }

  // Remove a versão antiga, que aparecia isolada na parte inferior da arte.
  document.getElementById('vdHowToBtn')?.remove();

  if(!stage.querySelector('.h-howto')){
    const btn=document.createElement('button');
    btn.className='hot h-howto';
    btn.type='button';
    btn.setAttribute('aria-label','Como jogar');
    btn.title='Como jogar';
    btn.addEventListener('click',openHowTo);
    const newGame=stage.querySelector('.h-new');
    if(newGame) stage.insertBefore(btn,newGame);
    else stage.appendChild(btn);
  }
}

window.ValeHowToPlay={open:openHowTo,close:closeHowTo};
ensureStyles();
ensureModal();
ensureMenu();

const obs=new MutationObserver(()=>ensureMenu());
obs.observe(document.body,{childList:true,subtree:true});
})();

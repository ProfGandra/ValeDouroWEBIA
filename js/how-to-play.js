// ValeDouro WEBIA — Como Jogar no menu principal
(function(){
'use strict';
if(window.__VALE_HOW_TO_PLAY__) return;
window.__VALE_HOW_TO_PLAY__=true;

function ensureStyles(){
  if(document.getElementById('vd-howto-style')) return;
  const s=document.createElement('style');
  s.id='vd-howto-style';
  s.textContent=`
    .vd-howto-btn{position:absolute;left:50%;bottom:7.5%;transform:translateX(-50%);z-index:12;min-width:150px;padding:10px 18px;border:1px solid rgba(201,164,92,.72);border-radius:10px;background:rgba(19,15,11,.82);color:#efd38d;font-weight:800;letter-spacing:.03em;cursor:pointer;backdrop-filter:blur(5px);box-shadow:0 7px 20px rgba(0,0,0,.35)}
    .vd-howto-btn:hover{background:rgba(37,28,18,.96)}
    .vd-howto-modal{position:fixed;inset:0;z-index:16000;display:none;background:rgba(6,5,4,.9);backdrop-filter:blur(5px)}
    .vd-howto-modal.active{display:flex;flex-direction:column}
    .vd-howto-top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid rgba(201,164,92,.35);background:#17120d;color:#eadfce}
    .vd-howto-top strong{color:#edc878}
    .vd-howto-frame{flex:1;width:100%;border:0;background:#120f0b}
    @media(max-width:700px){.vd-howto-btn{bottom:5.5%;min-width:132px;padding:9px 14px}.vd-howto-top{padding:8px 10px}}
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
function ensureButton(){
  const opening=document.getElementById('opening');
  const stage=opening?.querySelector('.intro-stage');
  if(!stage||document.getElementById('vdHowToBtn')) return;
  if(getComputedStyle(stage).position==='static') stage.style.position='relative';
  const btn=document.createElement('button');
  btn.id='vdHowToBtn';
  btn.className='vd-howto-btn';
  btn.type='button';
  btn.textContent='COMO JOGAR';
  btn.title='Aprenda como jogar ValeDouro';
  btn.addEventListener('click',openHowTo);
  stage.appendChild(btn);
}

window.ValeHowToPlay={open:openHowTo,close:closeHowTo};
ensureStyles();
ensureModal();
ensureButton();

const obs=new MutationObserver(()=>ensureButton());
obs.observe(document.body,{childList:true,subtree:true});
})();

// ValeDouro WEBIA — controles internos da página História
(function(){
  'use strict';

  function installHistoryControls(){
    const iframe=document.querySelector('#history iframe');
    if(!iframe) return;

    const install=()=>{
      try{
        const doc=iframe.contentDocument;
        if(!doc||!doc.body) return;
        if(doc.getElementById('vdHistoryTopControls')) return;

        const style=doc.createElement('style');
        style.textContent=`
          .vd-history-controls{display:flex;justify-content:space-between;align-items:center;gap:12px;max-width:920px;margin:0 auto 24px;padding:14px 28px 0;box-sizing:border-box}
          .vd-history-controls.bottom{justify-content:center;margin:34px auto 8px;padding-top:0}
          .vd-history-btn{appearance:none;border:1px solid #7a5b33;border-radius:10px;background:#241a10;color:#f0d7a7;padding:10px 18px;font:600 15px/1.2 inherit;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.25)}
          .vd-history-btn:hover{background:#322415}
          .vd-history-btn.play{background:#6f5125;color:#fff4dc;border-color:#b68a46;font-size:17px;padding:12px 24px}
          @media(max-width:700px){.vd-history-controls{padding-left:18px;padding-right:18px}.vd-history-btn{width:auto}}
        `;
        doc.head.appendChild(style);

        const article=doc.querySelector('.history-page')||doc.body;
        const top=doc.createElement('div');
        top.id='vdHistoryTopControls';
        top.className='vd-history-controls';
        top.innerHTML='<button class="vd-history-btn" type="button">← Voltar</button>';
        top.querySelector('button').addEventListener('click',()=>window.show?.('opening'));
        article.parentNode.insertBefore(top,article);

        const bottom=doc.createElement('div');
        bottom.id='vdHistoryBottomControls';
        bottom.className='vd-history-controls bottom';
        bottom.innerHTML='<button class="vd-history-btn play" type="button">Jogar</button>';
        bottom.querySelector('button').addEventListener('click',()=>window.show?.('newgame'));
        article.parentNode.insertBefore(bottom,article.nextSibling);
      }catch(e){
        console.warn('Controles da História indisponíveis',e);
      }
    };

    iframe.addEventListener('load',install);
    install();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installHistoryControls);
  else installHistoryControls();
})();

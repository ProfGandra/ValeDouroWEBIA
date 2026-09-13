// ValeDouro WEBIA — identidade visual e avatar padrão
(function(){
  const DEFAULT_AVATAR = 'assets/avatars/generic.webp';
  const SIGNATURE_IMAGE = 'assets/branding/dgandra-signature.png?v=20260903-1';

  function ensureAvatar(character){
    if(character && !character.avatar) character.avatar = DEFAULT_AVATAR;
    return character;
  }

  function ensureAllAvatars(){
    if(window.state && Array.isArray(state.characters)) state.characters.forEach(ensureAvatar);
  }

  if(typeof window.renderCreateSlot === 'function'){
    const previousRenderCreateSlot = window.renderCreateSlot;
    window.renderCreateSlot = function(i){const result=previousRenderCreateSlot.apply(this,arguments);const preview=document.getElementById(`avatarPreview${i}`);if(preview&&!preview.getAttribute('src'))preview.src=DEFAULT_AVATAR;return result;};
  }
  if(typeof window.clearAvatar === 'function'){
    const previousClearAvatar=window.clearAvatar;window.clearAvatar=function(i){const result=previousClearAvatar.apply(this,arguments);const preview=document.getElementById(`avatarPreview${i}`);if(preview)preview.src=DEFAULT_AVATAR;return result;};
  }
  if(typeof window.showReview === 'function'){
    const previousShowReview=window.showReview;window.showReview=function(){ensureAllAvatars();if(typeof window.saveChars==='function')window.saveChars();return previousShowReview.apply(this,arguments);};
  }
  if(typeof window.openSheet === 'function'){
    const previousOpenSheet=window.openSheet;window.openSheet=function(i){if(window.state&&state.characters&&state.characters[i])ensureAvatar(state.characters[i]);return previousOpenSheet.apply(this,arguments);};
  }
  if(typeof window.downloadSheetPDF === 'function'){
    const previousDownloadSheetPDF=window.downloadSheetPDF;window.downloadSheetPDF=function(i){if(window.state&&state.characters&&state.characters[i])ensureAvatar(state.characters[i]);return previousDownloadSheetPDF.apply(this,arguments);};
  }
  if(typeof window.collectChars === 'function'){
    const previousCollectChars=window.collectChars;window.collectChars=function(){const result=previousCollectChars.apply(this,arguments);ensureAllAvatars();if(typeof window.saveChars==='function')window.saveChars();return result;};
  }
  ensureAllAvatars();
  let signature=document.getElementById('dgandraSignature');
  if(!signature){signature=document.createElement('div');signature.id='dgandraSignature';signature.className='dg-signature';signature.innerHTML=`<img src="${SIGNATURE_IMAGE}" alt="Desenvolvido por DGandra - 2026">`;document.body.appendChild(signature);}else{const img=signature.querySelector('img');if(img)img.src=SIGNATURE_IMAGE;}
  function syncSignature(){const opening=document.getElementById('opening');signature.classList.toggle('home',!!opening&&opening.classList.contains('active'));}
  syncSignature();
  if(typeof window.show==='function'){const previousShow=window.show;window.show=function(id){const result=previousShow.apply(this,arguments);requestAnimationFrame(syncSignature);return result;};}
  const observer=new MutationObserver(syncSignature);document.querySelectorAll('.screen').forEach(screen=>observer.observe(screen,{attributes:true,attributeFilter:['class']}));

  const load=(attr,src)=>{if(document.querySelector(`script[${attr}]`))return;const s=document.createElement('script');s.src=src;s.setAttribute(attr,'1');document.head.appendChild(s);};
  load('data-vd-history-controls','js/history-controls.js?v=20260904-1');
  load('data-vd-scene-fallback','js/scene-visuals-fallback.js?v=20260904-1');
  load('data-vd-quest-tracker','js/quest-tracker.js?v=20260907-1');
  load('data-vd-master-hardening','js/master-context-hardening.js?v=20260907-1');
  load('data-vd-narrative-drift-guard','js/narrative-drift-guard.js?v=20260913-1');
  load('data-vd-new-game-qst001','js/new-game-quest-start.js?v=20260912-1');
  load('data-vd-journal','js/journal.js?v=20260911-2');
  load('data-vd-ranger-journal','js/ranger-journal.js?v=20260911-1');
  load('data-vd-reputation','js/reputation.js?v=20260911-1');
  load('data-vd-reputation-bridge','js/reputation-bridge.js?v=20260912-1');
  load('data-vd-scene-continuity','js/scene-continuity.js?v=20260912-2');
  load('data-vd-journal-episodic','js/journal-episodic-bridge.js?v=20260912-4');
  load('data-vd-journal-runtime-fix','js/journal-runtime-fix.js?v=20260912-2');
  load('data-vd-economy','js/economy.js?v=20260912-2');
  load('data-vd-economy-transaction-fix','js/economy-transaction-fix.js?v=20260912-1');
  load('data-vd-inventory-actions','js/inventory-actions.js?v=20260912-1');
  load('data-vd-how-to-play','js/how-to-play.js?v=20260912-10');
})();
// ValeDouro WEBIA — identidade visual e avatar padrão
(function(){
  const DEFAULT_AVATAR = 'assets/avatars/generic.webp';
  const SIGNATURE_IMAGE = 'assets/branding/dgandra-signature.png?v=20260903-1';

  function ensureAvatar(character){
    if(character && !character.avatar) character.avatar = DEFAULT_AVATAR;
    return character;
  }

  function ensureAllAvatars(){
    if(window.state && Array.isArray(state.characters)){
      state.characters.forEach(ensureAvatar);
    }
  }

  if(typeof window.renderCreateSlot === 'function'){
    const previousRenderCreateSlot = window.renderCreateSlot;
    window.renderCreateSlot = function(i){
      const result = previousRenderCreateSlot.apply(this, arguments);
      const preview = document.getElementById(`avatarPreview${i}`);
      if(preview && !preview.getAttribute('src')) preview.src = DEFAULT_AVATAR;
      return result;
    };
  }

  if(typeof window.clearAvatar === 'function'){
    const previousClearAvatar = window.clearAvatar;
    window.clearAvatar = function(i){
      const result = previousClearAvatar.apply(this, arguments);
      const preview = document.getElementById(`avatarPreview${i}`);
      if(preview) preview.src = DEFAULT_AVATAR;
      return result;
    };
  }

  if(typeof window.showReview === 'function'){
    const previousShowReview = window.showReview;
    window.showReview = function(){
      ensureAllAvatars();
      if(typeof window.saveChars === 'function') window.saveChars();
      return previousShowReview.apply(this, arguments);
    };
  }

  if(typeof window.openSheet === 'function'){
    const previousOpenSheet = window.openSheet;
    window.openSheet = function(i){
      if(window.state && state.characters && state.characters[i]) ensureAvatar(state.characters[i]);
      return previousOpenSheet.apply(this, arguments);
    };
  }

  if(typeof window.downloadSheetPDF === 'function'){
    const previousDownloadSheetPDF = window.downloadSheetPDF;
    window.downloadSheetPDF = function(i){
      if(window.state && state.characters && state.characters[i]) ensureAvatar(state.characters[i]);
      return previousDownloadSheetPDF.apply(this, arguments);
    };
  }

  if(typeof window.collectChars === 'function'){
    const previousCollectChars = window.collectChars;
    window.collectChars = function(){
      const result = previousCollectChars.apply(this, arguments);
      ensureAllAvatars();
      if(typeof window.saveChars === 'function') window.saveChars();
      return result;
    };
  }

  ensureAllAvatars();

  let signature = document.getElementById('dgandraSignature');
  if(!signature){
    signature = document.createElement('div');
    signature.id = 'dgandraSignature';
    signature.className = 'dg-signature';
    signature.innerHTML = `<img src="${SIGNATURE_IMAGE}" alt="Desenvolvido por DGandra - 2026">`;
    document.body.appendChild(signature);
  } else {
    const img = signature.querySelector('img');
    if(img) img.src = SIGNATURE_IMAGE;
  }

  function syncSignature(){
    const opening = document.getElementById('opening');
    signature.classList.toggle('home', !!opening && opening.classList.contains('active'));
  }

  syncSignature();
  if(typeof window.show === 'function'){
    const previousShow = window.show;
    window.show = function(id){
      const result = previousShow.apply(this, arguments);
      requestAnimationFrame(syncSignature);
      return result;
    };
  }

  const observer = new MutationObserver(syncSignature);
  document.querySelectorAll('.screen').forEach(screen => observer.observe(screen,{attributes:true,attributeFilter:['class']}));

  if(!document.querySelector('script[data-vd-history-controls]')){
    const historyScript=document.createElement('script');
    historyScript.src='js/history-controls.js?v=20260904-1';
    historyScript.dataset.vdHistoryControls='1';
    document.head.appendChild(historyScript);
  }

  if(!document.querySelector('script[data-vd-scene-fallback]')){
    const sceneFallback=document.createElement('script');
    sceneFallback.src='js/scene-visuals-fallback.js?v=20260904-1';
    sceneFallback.dataset.vdSceneFallback='1';
    document.head.appendChild(sceneFallback);
  }

  if(!document.querySelector('script[data-vd-quest-tracker]')){
    const questTracker=document.createElement('script');
    questTracker.src='js/quest-tracker.js?v=20260907-1';
    questTracker.dataset.vdQuestTracker='1';
    document.head.appendChild(questTracker);
  }

  if(!document.querySelector('script[data-vd-master-hardening]')){
    const masterHardening=document.createElement('script');
    masterHardening.src='js/master-context-hardening.js?v=20260907-1';
    masterHardening.dataset.vdMasterHardening='1';
    document.head.appendChild(masterHardening);
  }

  if(!document.querySelector('script[data-vd-journal]')){
    const journal=document.createElement('script');
    journal.src='js/journal.js?v=20260911-2';
    journal.dataset.vdJournal='1';
    document.head.appendChild(journal);
  }

  if(!document.querySelector('script[data-vd-ranger-journal]')){
    const rangerJournal=document.createElement('script');
    rangerJournal.src='js/ranger-journal.js?v=20260911-1';
    rangerJournal.dataset.vdRangerJournal='1';
    document.head.appendChild(rangerJournal);
  }

  if(!document.querySelector('script[data-vd-reputation]')){
    const reputation=document.createElement('script');
    reputation.src='js/reputation.js?v=20260911-1';
    reputation.dataset.vdReputation='1';
    document.head.appendChild(reputation);
  }

  if(!document.querySelector('script[data-vd-reputation-bridge]')){
    const reputationBridge=document.createElement('script');
    reputationBridge.src='js/reputation-bridge.js?v=20260912-1';
    reputationBridge.dataset.vdReputationBridge='1';
    document.head.appendChild(reputationBridge);
  }
})();

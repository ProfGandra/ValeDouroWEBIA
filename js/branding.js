// ValeDouro WEBIA — identidade visual e avatar padrão
(function(){
  const DEFAULT_AVATAR = 'assets/avatars/generic.webp';
  const SIGNATURE_IMAGE = 'assets/branding/dgandra-signature.webp';

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

  const style = document.createElement('style');
  style.textContent = `
    .dg-signature{position:fixed;left:12px;right:auto;bottom:10px;z-index:12;width:92px;display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;user-select:none;opacity:.92;text-align:center;color:#e8d4ad;text-shadow:0 1px 3px #000;font-family:Georgia,'Times New Roman',serif}
    .dg-signature.home{left:auto;right:12px;width:106px}
    .dg-signature img{display:block;width:74px;height:74px;object-fit:contain;filter:drop-shadow(0 3px 5px rgba(0,0,0,.55))}
    .dg-signature.home img{width:86px;height:86px}
    .dg-signature span{font-size:9px;line-height:1.15;white-space:nowrap}
    @media(max-width:800px){.dg-signature{width:72px;bottom:6px;left:6px}.dg-signature.home{right:6px;width:78px}.dg-signature img{width:54px;height:54px}.dg-signature.home img{width:60px;height:60px}.dg-signature span{font-size:7px}}
    @media print{.dg-signature{display:none!important}}
  `;
  document.head.appendChild(style);

  const signature = document.createElement('div');
  signature.id = 'dgandraSignature';
  signature.className = 'dg-signature';
  signature.innerHTML = `<img src="${SIGNATURE_IMAGE}" alt=""><span>Desenvolvido por DGandra - 2026</span>`;
  document.body.appendChild(signature);

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
})();

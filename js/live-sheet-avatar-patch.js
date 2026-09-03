(function(){
'use strict';
const GENERIC='assets/avatars/generic.webp';
function srcFor(c){
  try{
    return window.ValeDouroAvatars?.avatarSrc(c)||GENERIC;
  }catch(e){return GENERIC;}
}
function applyImg(img,c){
  if(!img)return;
  img.alt='';
  img.setAttribute('aria-hidden','true');
  img.onerror=function(){this.onerror=null;this.src=GENERIC;};
  img.src=srcFor(c);
}
function patchSheetContainer(){
  const box=document.getElementById('sheetContent');
  const c=window.state?.characters?.[window.state?.active||0];
  if(box&&c)applyImg(box.querySelector('.vd-sheet-avatar'),c);
}
function patchReview(){
  const cards=document.querySelectorAll('#reviewCards .char-card');
  cards.forEach((card,i)=>applyImg(card.querySelector('.vd-sheet-avatar'),window.state?.characters?.[i]));
}
function patchParty(){
  document.querySelectorAll('#party .pc').forEach((pc,i)=>{
    const c=window.state?.characters?.[i];
    const img=pc.querySelector('.party-avatar,.character-avatar');
    if(img&&c)applyImg(img,c);
  });
}
function wrap(name,after){
  const fn=window[name]; if(typeof fn!=='function'||fn.__liveAvatarPatch)return;
  const wrapped=function(){const r=fn.apply(this,arguments);after.apply(this,arguments);return r;};
  wrapped.__liveAvatarPatch=true; window[name]=wrapped;
}
function install(){
  wrap('showReview',()=>setTimeout(patchReview,0));
  wrap('openSheet',(i)=>setTimeout(()=>{const c=window.state?.characters?.[i];const box=document.getElementById('sheetContent');if(box&&c)applyImg(box.querySelector('.vd-sheet-avatar'),c);},0));
  wrap('renderParty',()=>setTimeout(patchParty,0));
  setTimeout(()=>{patchReview();patchSheetContainer();patchParty();},0);
}
window.ValeDouroLiveSheetAvatar={srcFor,applyImg,install};
install();
})();
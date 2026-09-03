(function(){
'use strict';
const GENERIC='assets/avatars/generic.webp';
const CLASS_FILES={
 'barbaro':'barbaro.png','bárbaro':'barbaro.png','bardo':'bardo.png','bruxo':'bruxo.png','clerigo':'clerigo.png','clérigo':'clerigo.png','druida':'druida.png','feiticeiro':'feiticeiro.png','guerreiro':'guerreiro.png','ladino':'ladino.png','mago':'mago.png','monge':'monge.png','paladino':'paladino.png','ranger':'ranger.png','patrulheiro':'ranger.png'
};
function firstClass(c){return c?.classes?.[0]?.name||String(c?.cls||'').split(/\s+\d+/)[0]||''}
function classAvatar(c){const key=String(firstClass(c)).trim().toLowerCase();const file=CLASS_FILES[key];return file?`assets/avatars/${file}`:GENERIC}
function avatarSrc(c){const custom=c?.avatarData||c?.avatarUrl||c?.avatar;return custom||classAvatar(c)}
function avatarImg(c,cls='character-avatar'){const src=avatarSrc(c);return `<img class="${cls}" src="${src}" alt="" aria-hidden="true" onerror="this.onerror=null;this.src='${GENERIC}'">`}
function applyImage(img,c){if(!img||!c)return;img.alt='';img.setAttribute('aria-hidden','true');img.onerror=function(){this.onerror=null;this.src=GENERIC};img.src=avatarSrc(c)}
function decorateSheet(html,c){return `<div class="sheet-identity">${avatarImg(c,'character-avatar sheet-avatar')}<div class="sheet-identity-body">${html}</div></div>`}
function patch(){
 const originalSheet=window.sheet;
 if(typeof originalSheet==='function'&&!originalSheet.__avatarPatched){const wrapped=function(c){return decorateSheet(originalSheet(c),c)};wrapped.__avatarPatched=true;window.sheet=wrapped;}
 const originalRenderParty=window.renderParty;
 if(typeof originalRenderParty==='function'&&!originalRenderParty.__avatarPatched){const wrapped=function(){originalRenderParty();document.querySelectorAll('#party .pc').forEach((el,i)=>{const c=window.state?.characters?.[i];if(!c)return;let img=el.querySelector('.party-avatar');if(!img){el.insertAdjacentHTML('afterbegin',avatarImg(c,'character-avatar party-avatar'));img=el.querySelector('.party-avatar')}applyImage(img,c);});};wrapped.__avatarPatched=true;window.renderParty=wrapped;}
 const originalOpenSheet=window.openSheet;
 if(typeof originalOpenSheet==='function'&&!originalOpenSheet.__avatarPatched){const wrapped=function(i){originalOpenSheet(i);const c=window.state?.characters?.[i];applyImage(document.querySelector('#sheetContent .vd-sheet-avatar'),c);};wrapped.__avatarPatched=true;window.openSheet=wrapped;}
 const originalShowReview=window.showReview;
 if(typeof originalShowReview==='function'&&!originalShowReview.__avatarPatched){const wrapped=function(){originalShowReview();document.querySelectorAll('#reviewCards .vd-sheet-avatar').forEach((img,i)=>applyImage(img,window.state?.characters?.[i]));};wrapped.__avatarPatched=true;window.showReview=wrapped;}
 const originalShowLibrary=window.showLibrary;
 if(typeof originalShowLibrary==='function'&&!originalShowLibrary.__avatarPatched){const wrapped=function(){originalShowLibrary();document.querySelectorAll('#library .char-card').forEach((el,i)=>{const c=window.state?.characters?.[i];if(c&&!el.querySelector('.library-avatar'))el.insertAdjacentHTML('afterbegin',avatarImg(c,'character-avatar library-avatar'));});};wrapped.__avatarPatched=true;window.showLibrary=wrapped;}
}
window.ValeDouroAvatars={GENERIC,CLASS_FILES,firstClass,classAvatar,avatarSrc,avatarImg,applyImage,patch};
patch();
setTimeout(patch,0);
window.addEventListener('load',patch,{once:true});
})();
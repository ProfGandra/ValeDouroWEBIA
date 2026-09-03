(function(){
'use strict';
const GENERIC='assets/avatars/generic.webp';
const CLASS_FILES={
 'barbaro':'barbaro.png','bárbaro':'barbaro.png','bardo':'bardo.png','bruxo':'bruxo.png','clerigo':'clerigo.png','clérigo':'clerigo.png','druida':'druida.png','feiticeiro':'feiticeiro.png','guerreiro':'guerreiro.png','ladino':'ladino.png','mago':'mago.png','monge':'monge.png','paladino':'paladino.png','ranger':'ranger.png','patrulheiro':'ranger.png'
};
function firstClass(c){return c?.classes?.[0]?.name||String(c?.cls||'').split(/\s+\d+/)[0]||''}
function asset(path){try{return new URL(path,document.baseURI).href}catch{return path}}
function classAvatar(c){const key=String(firstClass(c)).trim().toLowerCase();const file=CLASS_FILES[key];return asset(file?`assets/avatars/${file}`:GENERIC)}
function validCustom(src){const s=String(src||'').trim();return /^(data:image\/|blob:|https?:\/\/)/i.test(s)}
function avatarSrc(c){const custom=c?.avatarData||c?.avatarUrl||c?.avatar;return validCustom(custom)?custom:classAvatar(c)}
function genericSrc(){return asset(GENERIC)}
function avatarImg(c,cls='character-avatar'){return `<img class="${cls}" src="${avatarSrc(c)}" alt="" aria-hidden="true">`}
function applyImage(img,c){if(!img||!c)return;img.alt='';img.setAttribute('aria-hidden','true');const wanted=avatarSrc(c),fallback=genericSrc();img.onerror=function(){if(this.src!==fallback){this.src=fallback;return}this.onerror=null;this.style.visibility='hidden'};if(img.src!==wanted)img.src=wanted;img.style.visibility='visible'}
function decorateSheet(html,c){return `<div class="sheet-identity">${avatarImg(c,'character-avatar sheet-avatar')}<div class="sheet-identity-body">${html}</div></div>`}
function syncParty(){document.querySelectorAll('#party .pc').forEach((el,i)=>{const c=window.state?.characters?.[i];if(!c)return;let img=el.querySelector('.party-avatar');if(!img){el.insertAdjacentHTML('afterbegin',avatarImg(c,'character-avatar party-avatar'));img=el.querySelector('.party-avatar')}applyImage(img,c)})}
function syncReview(){document.querySelectorAll('#reviewCards .vd-sheet-avatar').forEach((img,i)=>applyImage(img,window.state?.characters?.[i]))}
function syncSheet(){const active=window.state?.active??0;applyImage(document.querySelector('#sheetContent .vd-sheet-avatar'),window.state?.characters?.[active])}
function syncLibrary(){document.querySelectorAll('#library .char-card').forEach((el,i)=>{const c=window.state?.characters?.[i];if(!c)return;let img=el.querySelector('.library-avatar');if(!img){el.insertAdjacentHTML('afterbegin',avatarImg(c,'character-avatar library-avatar'));img=el.querySelector('.library-avatar')}applyImage(img,c)})}
function syncAll(){syncParty();syncReview();syncSheet();syncLibrary()}
function patch(){
 const originalSheet=window.sheet;
 if(typeof originalSheet==='function'&&!originalSheet.__avatarPatched){const wrapped=function(c){return decorateSheet(originalSheet(c),c)};wrapped.__avatarPatched=true;window.sheet=wrapped;}
 const originalRenderParty=window.renderParty;
 if(typeof originalRenderParty==='function'&&!originalRenderParty.__avatarPatched){const wrapped=function(){originalRenderParty();syncParty()};wrapped.__avatarPatched=true;window.renderParty=wrapped;}
 const originalOpenSheet=window.openSheet;
 if(typeof originalOpenSheet==='function'&&!originalOpenSheet.__avatarPatched){const wrapped=function(i){originalOpenSheet(i);syncSheet()};wrapped.__avatarPatched=true;window.openSheet=wrapped;}
 const originalShowReview=window.showReview;
 if(typeof originalShowReview==='function'&&!originalShowReview.__avatarPatched){const wrapped=function(){originalShowReview();syncReview()};wrapped.__avatarPatched=true;window.showReview=wrapped;}
 const originalShowLibrary=window.showLibrary;
 if(typeof originalShowLibrary==='function'&&!originalShowLibrary.__avatarPatched){const wrapped=function(){originalShowLibrary();syncLibrary()};wrapped.__avatarPatched=true;window.showLibrary=wrapped;}
 syncAll();
}
window.ValeDouroAvatars={GENERIC,CLASS_FILES,firstClass,classAvatar,avatarSrc,avatarImg,applyImage,syncAll,patch};
patch();
setTimeout(patch,0);
window.addEventListener('load',patch,{once:true});
const observer=new MutationObserver(()=>syncAll());
function observe(){if(document.body)observer.observe(document.body,{childList:true,subtree:true});else setTimeout(observe,0)}
observe();
})();
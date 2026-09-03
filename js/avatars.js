(function(){
'use strict';
const GENERIC='assets/avatars/generic.webp';
const CLASS_FILES={
 'barbaro':'barbaro.png','bárbaro':'barbaro.png','bardo':'bardo.png','bruxo':'bruxo.png','clerigo':'clerigo.png','clérigo':'clerigo.png','druida':'druida.png','feiticeiro':'feiticeiro.png','guerreiro':'guerreiro.png','ladino':'ladino.png','mago':'mago.png','monge':'monge.png','paladino':'paladino.png','ranger':'ranger.png','patrulheiro':'ranger.png'
};
function firstClass(c){return c?.classes?.[0]?.name||String(c?.cls||'').split(/\s+\d+/)[0]||''}
function classAvatar(c){const key=String(firstClass(c)).trim().toLowerCase();const file=CLASS_FILES[key];return file?`assets/avatars/${file}`:GENERIC}
function avatarSrc(c){return c?.avatarData||c?.avatarUrl||c?.avatar||classAvatar(c)}
function avatarImg(c,cls='character-avatar'){const src=avatarSrc(c);const name=(c?.name||'Personagem').replace(/"/g,'&quot;');return `<img class="${cls}" src="${src}" alt="Avatar de ${name}" onerror="this.onerror=null;this.src='${GENERIC}'">`}
function decorateSheet(html,c){return `<div class="sheet-identity">${avatarImg(c,'character-avatar sheet-avatar')}<div class="sheet-identity-body">${html}</div></div>`}
function patch(){
 const originalSheet=window.sheet;
 if(typeof originalSheet==='function'&&!originalSheet.__avatarPatched){const wrapped=function(c){return decorateSheet(originalSheet(c),c)};wrapped.__avatarPatched=true;window.sheet=wrapped;}
 const originalRenderParty=window.renderParty;
 if(typeof originalRenderParty==='function'&&!originalRenderParty.__avatarPatched){const wrapped=function(){originalRenderParty();document.querySelectorAll('#party .pc').forEach((el,i)=>{const c=window.state?.characters?.[i];if(c&&!el.querySelector('.party-avatar'))el.insertAdjacentHTML('afterbegin',avatarImg(c,'character-avatar party-avatar'));});};wrapped.__avatarPatched=true;window.renderParty=wrapped;}
 const originalShowLibrary=window.showLibrary;
 if(typeof originalShowLibrary==='function'&&!originalShowLibrary.__avatarPatched){const wrapped=function(){originalShowLibrary();document.querySelectorAll('#library .char-card').forEach((el,i)=>{const c=window.state?.characters?.[i];if(c&&!el.querySelector('.library-avatar'))el.insertAdjacentHTML('afterbegin',avatarImg(c,'character-avatar library-avatar'));});};wrapped.__avatarPatched=true;window.showLibrary=wrapped;}
}
window.ValeDouroAvatars={GENERIC,CLASS_FILES,firstClass,classAvatar,avatarSrc,avatarImg,patch};
patch();
})();
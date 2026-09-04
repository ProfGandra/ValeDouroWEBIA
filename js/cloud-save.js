// ValeDouro WEBIA — Login Google + sincronização Firestore
// Firestore é a fonte de verdade; localStorage funciona como cache local/offline.
(async function(){
'use strict';
const PREFIX='valedouro.';
const META_KEY='valedouro.cloud.meta.v1';
const DEVICE_KEY='valedouro.cloud.device.v1';
const EXCLUDED=new Set([META_KEY,DEVICE_KEY]);
const FIREBASE_VERSION='10.14.1';
const cfg=window.VALEDOURO_FIREBASE_CONFIG||{};
const configured=!!(cfg.apiKey&&cfg.authDomain&&cfg.projectId&&cfg.appId);
const nativeSet=Storage.prototype.setItem;
const nativeRemove=Storage.prototype.removeItem;
const nativeClear=Storage.prototype.clear;
let auth=null,db=null,currentUser=null,cloudReady=false,syncTimer=null,suppress=false;
let fb={};
const deviceId=(()=>{let id=localStorage.getItem(DEVICE_KEY);if(!id){id='vd-device-'+(crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2));nativeSet.call(localStorage,DEVICE_KEY,id)}return id})();
function loadMeta(){try{const x=JSON.parse(localStorage.getItem(META_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
function saveMeta(meta){nativeSet.call(localStorage,META_KEY,JSON.stringify(meta))}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function status(text,kind=''){const e=document.getElementById('cloudStatus');if(e){e.textContent=text;e.className='cloud-status '+kind}const mini=document.getElementById('cloudMini');if(mini)mini.textContent=text}
function updateUI(){const login=document.getElementById('googleLoginBtn'),logout=document.getElementById('googleLogoutBtn'),sync=document.getElementById('cloudSyncBtn'),name=document.getElementById('cloudUserName'),avatar=document.getElementById('cloudUserAvatar');if(!configured){if(login){login.disabled=true;login.textContent='Google não configurado'}status('☁ Nuvem não configurada','warn');return}if(currentUser){if(login)login.style.display='none';if(logout)logout.style.display='inline-flex';if(sync)sync.style.display='inline-flex';if(name){name.textContent=currentUser.displayName||currentUser.email||'Jogador';name.style.display='inline'}if(avatar&&currentUser.photoURL){avatar.src=currentUser.photoURL;avatar.style.display='block'}}else{if(login){login.style.display='inline-flex';login.disabled=false;login.textContent='Entrar com Google'}if(logout)logout.style.display='none';if(sync)sync.style.display='none';if(name)name.style.display='none';if(avatar)avatar.style.display='none';status('☁ Entre com Google para salvar na nuvem','') }}
function trackedKeys(){const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PREFIX)&&!EXCLUDED.has(k)&&!k.startsWith('valedouro.cloud.'))out.push(k)}return out.sort()}
function encodeKey(key){return btoa(unescape(encodeURIComponent(key))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function markLocalChange(key,deleted=false){if(!key?.startsWith(PREFIX)||EXCLUDED.has(key)||key.startsWith('valedouro.cloud.'))return;const meta=loadMeta(),old=meta[key]||{};meta[key]={modifiedAt:Date.now(),revision:(Number(old.revision)||0)+1,deviceId,deleted:!!deleted};saveMeta(meta);queueSync()}
Storage.prototype.setItem=function(key,value){const r=nativeSet.apply(this,arguments);if(this===localStorage&&!suppress)markLocalChange(String(key),false);return r};
Storage.prototype.removeItem=function(key){const r=nativeRemove.apply(this,arguments);if(this===localStorage&&!suppress)markLocalChange(String(key),true);return r};
Storage.prototype.clear=function(){if(this!==localStorage)return nativeClear.apply(this,arguments);const keys=trackedKeys();const r=nativeClear.apply(this,arguments);nativeSet.call(localStorage,DEVICE_KEY,deviceId);if(!suppress)keys.forEach(k=>markLocalChange(k,true));return r};
function queueSync(){if(!currentUser||!cloudReady)return;clearTimeout(syncTimer);status('⟳ Sincronizando...','busy');syncTimer=setTimeout(()=>syncNow().catch(e=>{console.warn('Falha ao sincronizar',e);status('⚠ Alterações locais pendentes','warn')}),900)}
async function importFirebase(){const [appMod,authMod,fireMod]=await Promise.all([
 import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
 import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
 import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
]);fb={...appMod,...authMod,...fireMod};const app=fb.initializeApp(cfg);auth=fb.getAuth(app);db=fb.getFirestore(app);await fb.setPersistence(auth,fb.browserLocalPersistence);fb.onAuthStateChanged(auth,onAuthStateChanged)}
async function writeProfile(user){const ref=fb.doc(db,'users',user.uid);await fb.setDoc(ref,{uid:user.uid,displayName:user.displayName||'',email:user.email||'',photoURL:user.photoURL||'',lastLoginAt:fb.serverTimestamp(),updatedAt:fb.serverTimestamp()},{merge:true})}
async function uploadKey(key){if(!currentUser)return;const meta=loadMeta(),m=meta[key]||{modifiedAt:Date.now(),revision:1,deviceId,deleted:false};const value=localStorage.getItem(key);const ref=fb.doc(db,'users',currentUser.uid,'state',encodeKey(key));await fb.setDoc(ref,{key,value,deleted:value===null||!!m.deleted,modifiedAt:Number(m.modifiedAt)||Date.now(),revision:Number(m.revision)||1,deviceId:m.deviceId||deviceId,updatedAt:fb.serverTimestamp()},{merge:true})}
async function syncNow(){if(!currentUser||!cloudReady)return {ok:false};status('⟳ Sincronizando...','busy');const meta=loadMeta();for(const key of trackedKeys())if(!meta[key])meta[key]={modifiedAt:Date.now(),revision:1,deviceId,deleted:false};saveMeta(meta);const pending=Object.keys(meta).filter(k=>k.startsWith(PREFIX)&&!EXCLUDED.has(k)&&!k.startsWith('valedouro.cloud.'));for(const key of pending)await uploadKey(key);status('☁ Salvo na nuvem','ok');return {ok:true,keys:pending.length}}
async function initialMerge(){if(!currentUser)return;status('⟳ Carregando progresso...','busy');const col=fb.collection(db,'users',currentUser.uid,'state');const snap=await fb.getDocs(col);const docs=[];snap.forEach(d=>docs.push(d.data()));const localKeys=trackedKeys(),meta=loadMeta();if(!docs.length){for(const key of localKeys){if(!meta[key])meta[key]={modifiedAt:Date.now(),revision:1,deviceId,deleted:false}}saveMeta(meta);await syncNow();status('☁ Progresso local enviado à nuvem','ok');return}
let changed=false;suppress=true;try{for(const remote of docs){if(!remote?.key||remote.key.startsWith('valedouro.cloud.'))continue;const localMeta=meta[remote.key],remoteTime=Number(remote.modifiedAt)||0,localTime=Number(localMeta?.modifiedAt)||0;if(localMeta&&localTime>remoteTime){continue}if(remote.deleted){nativeRemove.call(localStorage,remote.key)}else if(remote.value!=null){nativeSet.call(localStorage,remote.key,String(remote.value))}meta[remote.key]={modifiedAt:remoteTime||Date.now(),revision:Number(remote.revision)||1,deviceId:remote.deviceId||'cloud',deleted:!!remote.deleted};changed=true}}finally{suppress=false;saveMeta(meta)}
for(const key of trackedKeys()){const lm=meta[key];if(lm&&docs.some(r=>r.key===key))continue;if(!lm)meta[key]={modifiedAt:Date.now(),revision:1,deviceId,deleted:false};await uploadKey(key)}saveMeta(meta);status('☁ Progresso sincronizado','ok');if(changed&&!sessionStorage.getItem('valedouro.cloud.reloaded')){sessionStorage.setItem('valedouro.cloud.reloaded','1');setTimeout(()=>location.reload(),250)}}
async function onAuthStateChanged(user){currentUser=user||null;cloudReady=!!user;updateUI();if(!user){sessionStorage.removeItem('valedouro.cloud.reloaded');return}try{await writeProfile(user);await initialMerge()}catch(e){console.warn('Falha ao carregar nuvem',e);status('⚠ Nuvem indisponível; usando cache local','warn')}}
async function login(){if(!configured||!auth)return;try{const provider=new fb.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await fb.signInWithPopup(auth,provider)}catch(e){console.warn('Login Google falhou',e);if(e?.code==='auth/popup-blocked')await fb.signInWithRedirect(auth,new fb.GoogleAuthProvider());else status('⚠ Não foi possível entrar com Google','warn')}}
async function logout(){if(!auth||!currentUser)return;try{await syncNow()}catch{}await fb.signOut(auth);status('☁ Sessão encerrada','')}
async function forceSync(){try{await syncNow()}catch(e){console.warn(e);status('⚠ Falha ao sincronizar','warn')}}
window.ValeCloud={login,logout,syncNow:forceSync,get user(){return currentUser},get configured(){return configured},deviceId};
window.addEventListener('beforeunload',()=>{if(currentUser)queueSync()});
window.addEventListener('online',()=>{if(currentUser)queueSync()});
window.addEventListener('offline',()=>status('⚠ Offline — salvando localmente','warn'));
document.addEventListener('DOMContentLoaded',updateUI);
if(configured){try{await importFirebase()}catch(e){console.warn('Firebase não inicializado',e);status('⚠ Firebase indisponível','warn')}}else updateUI();
})();

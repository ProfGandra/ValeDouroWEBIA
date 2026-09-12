(()=>{
'use strict';

const KEY='valedouro.terms.acceptance.v1';
const VERSION='2026-09-05';

function loadOptionalAudioSystems(){
  const scripts=[
    ['valeAmbienceManagerScript','js/ambience-manager.js?v=20260906-1'],
    ['valeFxManagerScript','js/fx-manager.js?v=20260906-1']
  ];
  for(const [id,src] of scripts){
    if(document.getElementById(id))continue;
    const s=document.createElement('script');s.id=id;s.src=src;s.defer=true;document.head.appendChild(s);
  }
}

function readAcceptance(){
  try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}
}
function isAccepted(){const a=readAcceptance();return !!(a&&a.accepted===true&&a.version===VERSION)}
function saveAcceptance(){
  const value={accepted:true,version:VERSION,acceptedAt:new Date().toISOString()};
  localStorage.setItem(KEY,JSON.stringify(value));
  return value;
}
function gate(){return document.getElementById('valeAccessGate')}
function setOpen(open){
  const g=gate();if(!g)return;
  g.classList.toggle('active',!!open);
  g.setAttribute('aria-hidden',open?'false':'true');
  document.body.classList.toggle('vale-access-locked',!!open);
}
async function acceptAndEnter(){
  const check=document.getElementById('valeTermsCheck');
  if(!check?.checked)return;
  saveAcceptance();
  try{window.ValeAudio?.resume?.();window.ValeAudio?.play?.('main_menu')}catch{}
  setOpen(false);
  try{if(window.ValeCloud?.user)await window.ValeCloud.syncNow()}catch(e){console.warn('Aceite salvo localmente; sincronização será tentada novamente.',e)}
}
function init(){
  loadOptionalAudioSystems();
  const g=gate();if(!g)return;
  const check=document.getElementById('valeTermsCheck');
  const btn=document.getElementById('valeEnterBtn');
  if(check&&btn){
    check.checked=false;
    const refresh=()=>{btn.disabled=!check.checked};
    check.addEventListener('change',refresh);refresh();
    btn.addEventListener('click',acceptAndEnter);
  }
  // Regra oficial: o aviso deve ser exibido em toda nova entrada/recarregamento.
  // O aceite continua registrado para auditoria/controle de versão, mas não pula o gate.
  setOpen(true);
}

window.ValeAccess={version:VERSION,isAccepted,acceptAndEnter,reset(){localStorage.removeItem(KEY);setOpen(true)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

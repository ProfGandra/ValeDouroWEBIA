(()=>{
'use strict';
const KEY='valedouro.session.v1';
let saveTimer=null;
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return x&&typeof x==='object'?x:null}catch{return null}}
function serializableCharacters(){try{return JSON.parse(JSON.stringify(state.characters||[]))}catch{return []}}
function storySnapshot(){const host=document.getElementById('story');if(!host)return[];return [...host.children].filter(n=>!(/pensando/i.test(n.textContent||'')&&n.classList.contains('master'))).map(n=>({className:n.className,html:n.innerHTML}))}
function saveNow(){if(!window.state||!(state.characters||[]).length)return false;const game=document.getElementById('game');const payload={version:1,updatedAt:new Date().toISOString(),characters:serializableCharacters(),active:Number(state.active)||0,history:Array.isArray(state.history)?state.history.slice(-120):[],pendingCheck:state.pendingCheck?JSON.parse(JSON.stringify(state.pendingCheck)):null,story:storySnapshot(),campaignId:window.ValeDouroCampaign?.read?.()?.currentQuestId||null};localStorage.setItem(KEY,JSON.stringify(payload));return true}
function queueSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveNow,180)}
function restoreStory(entries){const host=document.getElementById('story');if(!host)return;host.innerHTML='';(entries||[]).forEach(e=>{const d=document.createElement('div');d.className=e.className||'entry';d.innerHTML=e.html||'';host.appendChild(d)});host.scrollTop=host.scrollHeight}
async function restore(){const s=read();if(!s?.characters?.length)return false;state.characters=JSON.parse(JSON.stringify(s.characters));state.active=Math.max(0,Math.min(Number(s.active)||0,state.characters.length-1));state.history=Array.isArray(s.history)?s.history:[];state.pendingCheck=s.pendingCheck||null;try{await window.ValeDouroCampaign?.loadCurrent?.()}catch(e){console.warn('Campanha não pôde ser restaurada',e)}renderParty();selectPC(state.active);restoreStory(s.story);show('game');const rb=document.getElementById('rollbox');if(state.pendingCheck){const r=state.pendingCheck,p=state.characters[r.playerIndex??state.active];if(rb)rb.classList.add('active');const rt=document.getElementById('rollText');if(rt&&p)rt.innerHTML=`<strong>${esc(p.name)}</strong>: teste de ${labels[r.attr]||r.attr} (${r.attr}), CD ${r.cd}<br><span class="muted">${esc(r.motivo||'')}</span>`;const die=document.getElementById('die');if(die)die.textContent='d20';const rr=document.getElementById('rollResult');if(rr)rr.innerHTML='';const btn=document.getElementById('rollBtn');if(btn)btn.disabled=false}else if(rb)rb.classList.remove('active');const actBtn=document.getElementById('actBtn');if(actBtn)actBtn.disabled=!!state.pendingCheck;return true}
const previousResume=window.resumeGame;
window.resumeGame=async function(){if(await restore())return;return previousResume?.apply(this,arguments)};
const previousStart=window.startAdventure;
window.startAdventure=async function(){localStorage.removeItem(KEY);const r=await previousStart?.apply(this,arguments);queueSave();return r};
['act','askAI','rollCheck'].forEach(name=>{const fn=window[name];if(typeof fn==='function')window[name]=async function(){try{return await fn.apply(this,arguments)}finally{queueSave()}}});
const oldSelect=window.selectPC;if(typeof oldSelect==='function')window.selectPC=function(){const r=oldSelect.apply(this,arguments);queueSave();return r};
document.addEventListener('DOMContentLoaded',()=>{const host=document.getElementById('story');if(host)new MutationObserver(queueSave).observe(host,{childList:true,subtree:true,characterData:true});});
window.addEventListener('pagehide',saveNow);window.addEventListener('beforeunload',saveNow);window.ValeSession={read,save:saveNow,restore,clear(){localStorage.removeItem(KEY)}};
})();

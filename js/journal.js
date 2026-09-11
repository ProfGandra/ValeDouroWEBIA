// ValeDouro WEBIA — Diário diegético do personagem
(function(){
'use strict';
const KEY='valedouro.journal.v1';
const BASE_CATALOG='data/journal/base-entries.json';
const NOTEBOOK_RE=/caderno|di[aá]rio|notebook|livro\s*de\s*notas/i;
let catalog={};

const esc=s=>window.esc?window.esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const charKey=c=>`${c?.name||'sem-nome'}|${c?.cls||''}`;
function readAll(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
function writeAll(x){localStorage.setItem(KEY,JSON.stringify(x));window.dispatchEvent(new CustomEvent('valedouro:journal-change'))}
function stateFor(c){const all=readAll(),k=charKey(c);if(!all[k])all[k]={version:1,active:false,boundItemId:null,boundItemName:null,startedAt:null,entries:[],seenEntryIds:[],updatedAt:null};return {...all[k],entries:Array.isArray(all[k].entries)?all[k].entries:[],seenEntryIds:Array.isArray(all[k].seenEntryIds)?all[k].seenEntryIds:[]}}
function saveFor(c,j){const all=readAll(),k=charKey(c);j.updatedAt=new Date().toISOString();all[k]=j;writeAll(all);return j}
function inventoryFor(c){try{if(window.ValeInventory?.ensure)return window.ValeInventory.ensure(c)}catch{}try{const db=JSON.parse(localStorage.getItem('valedouro.inventory.v2')||'{}');return db[charKey(c)]||null}catch{return null}}
function allItems(c){const inv=inventoryFor(c);return [...(inv?.items||[]),...(inv?.resources||[])]}
function isNotebook(it){return !!it&&Number(it.qty||0)>0&&!['lost','abandoned'].includes(it.state)&&((it.journalCapable===true)||NOTEBOOK_RE.test(String(it.name||''))||NOTEBOOK_RE.test(String(it.id||'')))}
function compatibleItems(c){return allItems(c).filter(isNotebook)}
function boundAvailable(c,j){if(!j.active||!j.boundItemId)return false;const it=allItems(c).find(x=>x.id===j.boundItemId);return isNotebook(it)}
function activeCharacter(){return window.state?.characters?.[window.state?.active||0]||null}
function bind(c,itemId){const item=compatibleItems(c).find(x=>x.id===itemId);if(!item)return {ok:false,reason:'item-unavailable'};const j=stateFor(c);j.active=true;j.boundItemId=item.id;j.boundItemName=item.name||'Caderno';j.startedAt=j.startedAt||new Date().toISOString();saveFor(c,j);syncButton();open();return {ok:true}}
function unbind(c){const j=stateFor(c);j.active=false;j.boundItemId=null;j.boundItemName=null;saveFor(c,j);syncButton()}
function addEntry(c,e){if(!c||!e)return false;const j=stateFor(c);if(!j.active||!boundAvailable(c,j))return false;const id=String(e.id||`entry-${Date.now()}`);if(j.seenEntryIds.includes(id))return false;j.entries.push({id,at:e.at||new Date().toISOString(),title:e.title||'Registro',body:e.body||'',learnings:Array.isArray(e.learnings)?e.learnings:[],people:Array.isArray(e.people)?e.people:[],places:Array.isArray(e.places)?e.places:[],illustration:e.illustration||null,source:e.source||null,questId:e.questId||null});j.seenEntryIds.push(id);j.seenEntryIds=j.seenEntryIds.slice(-1000);saveFor(c,j);return true}
function registerCatalog(entries){if(Array.isArray(entries))entries.forEach(e=>{if(e?.questId)catalog[e.questId]=e});else if(entries&&typeof entries==='object')Object.assign(catalog,entries)}
async function loadBaseCatalog(){try{const r=await fetch(BASE_CATALOG,{cache:'no-store'});if(r.ok)registerCatalog(await r.json())}catch(e){console.warn('Diário: catálogo-base indisponível',e)}}
async function recordQuest(id){const tpl=catalog[id];if(!tpl)return;for(const c of (window.state?.characters||[])){const j=stateFor(c);if(!j.active||!boundAvailable(c,j))continue;addEntry(c,{...tpl,id:`quest-${id}`,questId:id,source:'quest'})}}
function publicState(){return (window.state?.characters||[]).map(c=>{const j=stateFor(c),available=boundAvailable(c,j);return {character:c.name,enabled:!!j.active,available,boundItemName:j.boundItemName,startedAt:j.startedAt,entryCount:j.entries.length,lastEntry:j.entries.at(-1)?.title||null}})}

function ensureUI(){if(document.getElementById('journalBtn'))return;const style=document.createElement('style');style.textContent=`
#journalBtn[disabled]{opacity:.45;cursor:not-allowed}.journal-modal .panel{width:min(920px,94vw);max-height:88vh;overflow:auto;background:#19140f}.journal-cover{padding:18px;border:1px solid #806a4a;border-radius:12px;background:linear-gradient(135deg,#2b2117,#17110c);margin-bottom:16px}.journal-entry{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,34%);gap:18px;padding:18px 0;border-top:1px solid rgba(212,184,130,.24)}.journal-entry:first-child{border-top:0}.journal-entry h3{margin:0 0 8px;color:#e3c98c}.journal-entry p{line-height:1.55}.journal-entry ul{margin:8px 0 0;padding-left:20px}.journal-sketch{width:100%;max-height:320px;object-fit:contain;border-radius:8px;filter:grayscale(1) contrast(.92);background:#d8ccb0;padding:6px}.journal-meta{font-size:12px;opacity:.7}.journal-bind-list{display:grid;gap:10px}.journal-bind-card{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px;border:1px solid rgba(212,184,130,.25);border-radius:10px}.journal-empty{padding:28px;text-align:center;opacity:.8}@media(max-width:700px){.journal-entry{grid-template-columns:1fr}.journal-sketch{max-height:240px}}`;
document.head.appendChild(style);
const gameButtons=document.querySelector('#game > .topbar > .row');if(gameButtons){const b=document.createElement('button');b.id='journalBtn';b.className='btn small';b.textContent='📖 Diário';b.onclick=()=>open();gameButtons.insertBefore(b,gameButtons.firstChild)}
const modal=document.createElement('div');modal.id='journalModal';modal.className='modal journal-modal';modal.innerHTML='<div class="panel sheet"><div class="row" style="justify-content:space-between"><h2>Diário</h2><button class="btn" onclick="ValeJournal.close()">Fechar</button></div><div id="journalContent"></div></div>';document.body.appendChild(modal);syncButton()}
function syncButton(){const b=document.getElementById('journalBtn'),c=activeCharacter();if(!b||!c)return;const j=stateFor(c),hasNotebook=compatibleItems(c).length>0,available=boundAvailable(c,j);b.disabled=!available&&!hasNotebook;b.title=available?`Diário: ${j.boundItemName||'caderno'}`:hasNotebook?'Você possui um caderno que pode ser usado como Diário.':'Você ainda não possui um caderno para usar como Diário.';b.textContent=available?'📖 Diário':hasNotebook?'📖 Diário':'📖 Diário 🔒'}
function formatDate(iso){try{return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(iso))}catch{return ''}}
function renderEntry(e){const sketch=e.illustration?`<div><img class="journal-sketch" src="${esc(e.illustration)}" alt="Ilustração do Diário" onerror="this.closest('div').style.display='none'"></div>`:'';const learns=e.learnings?.length?`<div><strong>Aprendizados</strong><ul>${e.learnings.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';return `<article class="journal-entry"><div><div class="journal-meta">${esc(formatDate(e.at))}</div><h3>${esc(e.title)}</h3><p>${esc(e.body).replace(/\n/g,'<br>')}</p>${learns}</div>${sketch}</article>`}
function open(){ensureUI();const c=activeCharacter();if(!c)return;const host=document.getElementById('journalContent'),j=stateFor(c),items=compatibleItems(c);if(!j.active||!boundAvailable(c,j)){if(!items.length){host.innerHTML='<div class="journal-empty"><h3>Diário indisponível</h3><p>Você ainda não possui um caderno que possa ser usado como Diário.</p></div>';document.getElementById('journalModal').classList.add('active');return}host.innerHTML=`<div class="journal-cover"><h3>Escolha um caderno</h3><p>O Diário só começa a registrar acontecimentos depois que você decide usar um caderno para essa finalidade. Registros anteriores não são criados retroativamente.</p></div><div class="journal-bind-list">${items.map(it=>`<div class="journal-bind-card"><div><strong>${esc(it.name)}</strong><div class="muted">${esc(it.source||it.category||'Item pessoal')}</div></div><button class="btn primary" onclick="ValeJournal.bindActive(${JSON.stringify(it.id)})">Usar como Diário</button></div>`).join('')}</div>`;document.getElementById('journalModal').classList.add('active');return}
host.innerHTML=`<div class="journal-cover"><h3>${esc(j.boundItemName||'Diário')} — ${esc(c.name)}</h3><p>Registros automáticos daquilo que foi vivido, observado e aprendido desde que este caderno passou a ser usado como Diário.</p><div class="journal-meta">Iniciado em ${esc(formatDate(j.startedAt))} • ${j.entries.length} registro(s)</div></div>${j.entries.length?j.entries.slice().reverse().map(renderEntry).join(''):'<div class="journal-empty">As páginas ainda estão em branco.</div>'}`;document.getElementById('journalModal').classList.add('active')}
function close(){document.getElementById('journalModal')?.classList.remove('active')}
function bindActive(itemId){const c=activeCharacter();if(c)bind(c,itemId)}

// Expõe ao Mestre apenas o estado necessário. O conteúdo completo do Diário permanece local/persistente.
const previousFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  if((typeof AI_ENDPOINT!=='undefined'&&url===AI_ENDPOINT)&&init?.method==='POST'&&init.body){
    try{const b=JSON.parse(init.body);b.state={...(b.state||{}),journal:publicState()};init={...init,body:JSON.stringify(b)}}catch(e){console.warn('Diário: estado não injetado',e)}
  }
  const res=await previousFetch(input,init);
  try{
    const data=await res.clone().json();
    if(typeof data?.text==='string'&&data.text.includes('[[JOURNAL:')){
      let changed=false;
      data.text=data.text.replace(/\s*\[\[JOURNAL:([^\]]+)\]\]\s*/gi,(_,payload)=>{
        try{const e=JSON.parse(decodeURIComponent(payload));const c=window.state?.characters?.[Number.isInteger(e.characterIndex)?e.characterIndex:(window.state?.active||0)];if(c&&addEntry(c,e))changed=true}catch(err){console.warn('Diário: registro inválido',err)}
        return ' ';
      });
      if(changed){data.text=data.text.trim();const headers=new Headers(res.headers);headers.set('Content-Type','application/json; charset=utf-8');return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers})}
    }
  }catch{}
  return res;
};

window.ValeJournal={stateFor,bind,bindActive,unbind,addEntry,recordQuest,registerCatalog,compatibleItems,publicState,open,close,syncButton};
window.openJournal=open;
window.addEventListener('valedouro:quest-complete',e=>recordQuest(e.detail?.completed));
window.addEventListener('valedouro:inventory-change',syncButton);
window.addEventListener('valedouro:journal-change',syncButton);
window.addEventListener('DOMContentLoaded',()=>{ensureUI();loadBaseCatalog();setInterval(syncButton,1800)});
if(document.readyState!=='loading'){ensureUI();loadBaseCatalog();setInterval(syncButton,1800)}
})();

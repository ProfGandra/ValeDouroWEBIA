// ValeDouro WEBIA — correções de runtime do Diário: deduplicação, paginação e composição visual
(function(){
'use strict';
if(window.__VALE_JOURNAL_RUNTIME_FIX__)return;
window.__VALE_JOURNAL_RUNTIME_FIX__=true;

const KEY='valedouro.journal.v1';
const esc=s=>window.esc?window.esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const activeCharacter=()=>window.state?.characters?.[window.state?.active||0]||null;
const charKey=c=>`${c?.name||'sem-nome'}|${c?.cls||''}`;
const localSource=s=>/decision-local|episode-local|episodic/i.test(String(s||''));

function readAll(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function writeAll(db){localStorage.setItem(KEY,JSON.stringify(db));window.dispatchEvent(new CustomEvent('valedouro:journal-change'))}
function secondsBetween(a,b){const x=Date.parse(a||0),y=Date.parse(b||0);return Number.isFinite(x)&&Number.isFinite(y)?Math.abs(x-y)/1000:999999}
function richer(a,b){
  const score=e=>String(e?.body||'').length+(e?.people?.length||0)*30+(e?.places?.length||0)*30+(e?.learnings?.length||0)*20+(e?.source==='episode-local'?40:0);
  return score(b)>score(a)?b:a;
}
function mergeEntry(base,extra){
  const best=richer(base,extra);
  return {...base,...best,id:base.id,at:base.at||extra.at,people:[...new Set([...(base.people||[]),...(extra.people||[])])],places:[...new Set([...(base.places||[]),...(extra.places||[])])],learnings:[...new Set([...(base.learnings||[]),...(extra.learnings||[])])]};
}
function dedupeJournal(){
  const db=readAll();let anyChanged=false;
  Object.values(db).forEach(j=>{
    if(!j||!Array.isArray(j.entries))return;
    let changed=false;const out=[];
    for(const e of j.entries){
      const idx=out.findIndex(x=>localSource(x.source)&&localSource(e.source)&&x.title===e.title&&secondsBetween(x.at,e.at)<=15);
      if(idx>=0){out[idx]=mergeEntry(out[idx],e);changed=true;anyChanged=true;}else out.push(e);
    }
    if(changed){j.entries=out;j.seenEntryIds=[...new Set(out.map(x=>x.id).filter(Boolean))].slice(-1000);j.updatedAt=new Date().toISOString();}
  });
  if(anyChanged)writeAll(db);
  return anyChanged;
}

function injectJournalStyle(){
  if(document.getElementById('valeJournalHandStyle'))return;
  const style=document.createElement('style');
  style.id='valeJournalHandStyle';
  style.textContent=`
    .journal-note h3,.journal-note p,.journal-note li,.journal-learnings strong,.journal-sketch-caption{
      font-family:"Segoe Print","Bradley Hand","Lucida Handwriting",cursive;
    }
    .journal-note h3{font-size:23px!important;line-height:1.28!important;font-weight:600!important;margin:0 0 10px!important;letter-spacing:.01em}
    .journal-note p{font-size:16.5px!important;line-height:1.58!important;margin:0!important;letter-spacing:.012em}
    .journal-note.compact h3{font-size:20px!important;margin-bottom:7px!important}
    .journal-note.compact p{font-size:15px!important;line-height:1.48!important}
    .journal-note.compact .journal-date{margin-bottom:7px!important}
    .journal-note-divider{margin:17px 10%!important;border-top:1px dashed rgba(65,47,29,.34)!important;position:relative}
    .journal-note-divider:after{content:'✦';position:absolute;left:50%;top:-9px;transform:translateX(-50%);padding:0 8px;background:#efe5ce;color:rgba(65,47,29,.45);font-size:11px}
    .journal-learnings{margin-top:12px;font-size:14px;line-height:1.45}
    .journal-learnings ul{margin-top:6px}
    .journal-date{font-family:Georgia,'Times New Roman',serif!important;font-size:10px!important;letter-spacing:.09em!important}
    .journal-index,.journal-index button,.journal-cover-page{font-family:Georgia,'Times New Roman',serif!important}
  `;
  document.head.appendChild(style);
}

function formatDate(iso){try{return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(iso))}catch{return ''}}
function entryHtml(e,compact=false){const learns=e.learnings?.length?`<div class="journal-learnings"><strong>Aprendizados</strong><ul>${e.learnings.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';return `<article class="journal-note ${compact?'compact':''}"><div class="journal-date">${esc(formatDate(e.at))}</div><h3>${esc(e.title)}</h3><p>${esc(e.body).replace(/\n/g,'<br>')}</p>${learns}</article>`}
function sketchHtml(e){return `<div class="journal-sketch-page"><img src="${esc(e.illustration)}" alt="Esboço a grafite: ${esc(e.title)}" onerror="this.parentElement.style.display='none'"><div class="journal-sketch-caption">${esc(e.title)}</div></div>`}
function isMobile(){return window.matchMedia('(max-width:760px)').matches}
function entryWeight(e){return String(e?.body||'').length+(e?.title?.length||0)*2+(e?.learnings?.length||0)*120+(e?.people?.length||0)*18+(e?.places?.length||0)*18}
function packedHtml(entries){const compact=entries.length>1;return entries.map((e,i)=>`${i?'<div class="journal-note-divider"></div>':''}${entryHtml(e,compact)}`).join('')}

function buildPages(c,j){
  const pages=[{kind:'cover',html:`<div class="journal-cover-page"><div class="quill">✒</div><h2>${esc(j.boundItemName||'Diário')}</h2><div class="owner">${esc(c.name)}</div><p>Registros de viagem, descobertas e aprendizados.</p><small>Iniciado em ${esc(formatDate(j.startedAt))}</small></div>`}];
  if(!j.entries?.length){pages.push({kind:'blank',html:'<div class="journal-blank">As páginas ainda estão em branco.</div>'});return pages;}
  const index={kind:'index',html:''};pages.push(index);
  const map=[];
  for(let i=0;i<j.entries.length;){
    const first=j.entries[i];
    if(first.illustration){
      map[i]=pages.length+1;
      pages.push({kind:'entry',entryIndexes:[i],html:entryHtml(first)});
      pages.push({kind:'sketch',entryIndexes:[i],html:sketchHtml(first)});
      i++;continue;
    }
    const bucket=[];let total=0;const start=i;
    while(i<j.entries.length&&bucket.length<4){
      const e=j.entries[i];if(e.illustration)break;
      const w=entryWeight(e);
      const projected=total+w+(bucket.length?85:0);
      if(bucket.length&&projected>900)break;
      bucket.push(e);total=projected;i++;
      if(w>650)break;
    }
    const pageNo=pages.length+1;
    for(let k=0;k<bucket.length;k++)map[start+k]=pageNo;
    pages.push({kind:'entry',entryIndexes:Array.from({length:bucket.length},(_,k)=>start+k),html:packedHtml(bucket)});
  }
  index.html=`<h3>Índice</h3><ul class="journal-index">${j.entries.map((e,i)=>`<li><button onclick="ValeJournal.goToEntry(${i})">${esc(e.title)}</button><span>${map[i]||''}</span></li>`).join('')}</ul>`;
  if(!isMobile()&&pages.length%2===1)pages.push({kind:'blank',html:''});
  return pages;
}
function currentCursor(){const txt=document.querySelector('.journal-counter')?.textContent||'';const m=txt.match(/(\d+)/);return m?Math.max(0,Number(m[1])-1):0}
function render(cursor,direction=''){
  const c=activeCharacter(),host=document.getElementById('journalContent');if(!c||!host||!window.ValeJournal)return;
  const j=window.ValeJournal.stateFor(c),pages=buildPages(c,j),step=isMobile()?1:2;
  cursor=Math.max(0,Math.min(cursor,Math.max(0,pages.length-step)));if(!isMobile())cursor-=cursor%2;
  const empty={html:''},left=pages[cursor]||empty,right=pages[cursor+1]||empty,anim=direction==='next'?'turn-next':direction==='prev'?'turn-prev':'';
  const page=(p,n,side)=>`<section class="journal-page ${side} ${anim} ${side==='right'&&isMobile()?'mobile-hidden':''}">${p.html}${p.html?`<div class="journal-pageno">${n}</div>`:''}</section>`;
  host.innerHTML=`<div class="journal-book">${page(left,cursor+1,'left')}${page(right,cursor+2,'right')}</div><div class="journal-nav"><button class="btn" ${cursor<=0?'disabled':''} onclick="ValeJournal.prevPage()">← Anterior</button><div class="journal-counter">${cursor+1}${isMobile()?'':`–${Math.min(cursor+2,pages.length)}`} de ${pages.length}</div><button class="btn" ${cursor+step>=pages.length?'disabled':''} onclick="ValeJournal.nextPage()">Próxima →</button></div>`;
}

function patchJournal(){
  if(!window.ValeJournal?.addEntry){setTimeout(patchJournal,120);return;}
  if(window.ValeJournal.__runtimeFixed)return;
  injectJournalStyle();dedupeJournal();
  const originalAdd=window.ValeJournal.addEntry.bind(window.ValeJournal);
  window.ValeJournal.addEntry=function(c,e){
    if(c&&e&&localSource(e.source)){
      const db=readAll(),k=charKey(c),j=db[k];
      if(j?.active&&Array.isArray(j.entries)){
        const idx=j.entries.findIndex(x=>localSource(x.source)&&x.title===e.title&&secondsBetween(x.at,e.at)<=15);
        if(idx>=0){j.entries[idx]=mergeEntry(j.entries[idx],e);j.updatedAt=new Date().toISOString();db[k]=j;writeAll(db);return true;}
      }
    }
    return originalAdd(c,e);
  };
  window.ValeJournal.nextPage=function(){render(currentCursor()+(isMobile()?1:2),'next')};
  window.ValeJournal.prevPage=function(){render(Math.max(0,currentCursor()-(isMobile()?1:2)),'prev')};
  window.ValeJournal.goToEntry=function(index){
    const c=activeCharacter();if(!c)return;const j=window.ValeJournal.stateFor(c),pages=buildPages(c,j);let target=pages.findIndex(p=>Array.isArray(p.entryIndexes)&&p.entryIndexes.includes(index)&&p.kind==='entry');if(target<0)target=2;if(!isMobile())target-=target%2;render(target,'next');
  };
  window.ValeJournal.__runtimeFixed=true;
}

patchJournal();
document.addEventListener('click',e=>{if(e.target?.id==='journalBtn')setTimeout(()=>render(0),0)});
window.addEventListener('valedouro:journal-change',()=>setTimeout(()=>{dedupeJournal();if(document.getElementById('journalModal')?.classList.contains('active'))render(currentCursor())},0));
})();

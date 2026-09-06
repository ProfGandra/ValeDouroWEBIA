(()=>{
'use strict';

const KEY='valedouro.sceneVisual.v2';
const CATALOG_URL='data/scene-visuals.json';
let catalog={version:1,quests:{}};
let catalogPromise=null;

function campaignQuest(){
  try{return window.ValeDouroCampaign?.read?.()?.currentQuestId||state?.hiddenQuest?.id||null}
  catch{return null}
}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function write(v){localStorage.setItem(KEY,JSON.stringify(v));return v}
function scenesFor(q){return Array.isArray(catalog?.quests?.[q])?catalog.quests[q]:[]}
function assetFor(q,id){return scenesFor(q).find(x=>String(x.id).toUpperCase()===String(id||'').toUpperCase())||null}
function valid(q,id){return !!assetFor(q,id)}
function firstSceneId(q){return scenesFor(q)[0]?.id||null}

async function loadCatalog(){
  if(catalogPromise)return catalogPromise;
  catalogPromise=(async()=>{
    try{
      const r=await fetch(CATALOG_URL,{cache:'no-store'});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const data=await r.json();
      if(!data||typeof data!=='object'||!data.quests)throw new Error('catálogo inválido');
      catalog=data;
    }catch(e){
      console.warn('Catálogo visual indisponível:',e);
      catalog={version:1,quests:{}};
    }
    return catalog;
  })();
  return catalogPromise;
}

function ensureState(){
  const q=campaignQuest(),s=read();
  if(!q)return s;
  const first=firstSceneId(q);
  if(s.questId!==q)return write({questId:q,sceneId:first,updatedAt:new Date().toISOString()});
  if(first&&!valid(q,s.sceneId))return write({questId:q,sceneId:first,updatedAt:new Date().toISOString()});
  if(!first&&s.sceneId)return write({questId:q,sceneId:null,updatedAt:new Date().toISOString()});
  return s;
}

function panel(){
  let p=document.getElementById('sceneVisual');
  const party=document.getElementById('party');
  if(!party)return p||null;
  if(!p){
    p=document.createElement('figure');p.id='sceneVisual';p.className='scene-visual';
    p.innerHTML='<img id="sceneVisualImg" alt=""><figcaption id="sceneVisualCaption"></figcaption>';
  }
  if(p.parentNode!==party.parentNode||p.previousElementSibling!==party)party.insertAdjacentElement('afterend',p);
  return p;
}

function installStyle(){
  if(document.getElementById('sceneVisualStyle'))return;
  const s=document.createElement('style');s.id='sceneVisualStyle';
  s.textContent='.scene-visual{display:none;width:100%;max-width:260px;margin:12px auto 14px;border:1px solid #4c3d2d;border-radius:10px;overflow:hidden;background:#17130f;box-shadow:0 5px 14px rgba(0,0,0,.28)}.scene-visual.active{display:block}.scene-visual img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#0d0b09}.scene-visual figcaption{padding:6px 8px;font-size:10px;line-height:1.25;color:#cdbfae;background:rgba(20,16,12,.96);text-align:center}@media(max-width:800px){.scene-visual{max-width:220px;margin:10px auto 12px;border-radius:8px}.scene-visual figcaption{font-size:9px;padding:5px 7px}}';
  document.head.appendChild(s);
}

async function render(){
  await loadCatalog();
  installStyle();
  const p=panel();if(!p)return;
  const s=ensureState(),asset=assetFor(s.questId,s.sceneId);
  if(!asset){p.classList.remove('active');return}
  const img=document.getElementById('sceneVisualImg'),cap=document.getElementById('sceneVisualCaption');
  if(img&&img.getAttribute('src')!==asset.src)img.src=asset.src;
  if(img)img.alt=asset.label||'';
  if(cap)cap.textContent=asset.label||'';
  p.classList.add('active');
}

async function setScene(sceneId,questId=campaignQuest()){
  await loadCatalog();
  const q=questId,id=String(sceneId||'').toUpperCase();
  if(!valid(q,id))return false;
  const previous=read();
  if(previous.questId===q&&previous.sceneId===id){await render();return true}
  write({questId:q,sceneId:id,updatedAt:new Date().toISOString()});
  await render();
  window.dispatchEvent(new CustomEvent('valedouro:scene-change',{detail:{questId:q,sceneId:id}}));
  return true;
}
function reset(){localStorage.removeItem(KEY);return render()}
function normalizeText(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim()}

function inferSceneFromNarrative(text,q=campaignQuest()){
  const t=normalizeText(text);if(!t)return null;
  const scenes=scenesFor(q);if(!scenes.length)return null;
  let best=null,bestScore=0;
  for(const scene of scenes){
    const words=normalizeText(scene.label).split(' ').filter(w=>w.length>=4);
    if(!words.length)continue;
    const score=words.reduce((n,w)=>n+(t.includes(w)?1:0),0)/words.length;
    if(score>bestScore){bestScore=score;best=scene.id}
  }
  return bestScore>=0.75?best:null;
}

function sceneRule(q){
  const scenes=scenesFor(q);if(!scenes.length)return null;
  const options=scenes.map(s=>`${s.id}=${s.label}`).join('; ');
  return `CONTROLE VISUAL DE CENA: a quest atual possui estas cenas visuais: ${options}. Quando os personagens passarem fisicamente para uma dessas cenas, inclua ao FINAL da resposta exatamente um marcador [[SCENE:ID]], substituindo ID por um dos IDs listados. Use apenas IDs desta lista. Não troque a cena por mera menção, lembrança, observação distante ou pista sobre outro lugar. Na abertura da quest, use a primeira cena listada quando ela corresponder ao ponto inicial. O marcador é metadado interno: não o explique ao jogador.`;
}

window.ValeSceneVisuals={
  loadCatalog,
  get catalog(){return catalog},
  scenesFor,
  read:ensureState,
  setScene,
  render,
  reset,
  inferSceneFromNarrative
};

const previousFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  const aiUrl=(typeof AI_ENDPOINT!=='undefined'?AI_ENDPOINT:null);
  let nextInit=init;

  if(url===aiUrl&&init?.method==='POST'&&init.body){
    try{
      await loadCatalog();
      const b=JSON.parse(init.body),q=campaignQuest(),rule=sceneRule(q),visualState=ensureState();
      if(rule){
        b.world={...(b.world||{}),scene_visual_instruction:rule,current_visual_scene:visualState.sceneId};
        if(b.quest)b.quest={...b.quest,visual_scene_directive:rule,visual_scenes:scenesFor(q)};
        b.state={...(b.state||{}),sceneVisual:{questId:q,sceneId:visualState.sceneId},sceneVisualRules:[rule],capabilityRules:[...((b.state?.capabilityRules)||[]),rule]};
        nextInit={...init,body:JSON.stringify(b)};
      }
    }catch(e){console.warn('Regra visual não injetada',e)}
  }

  const res=await previousFetch(input,nextInit);
  if(url!==aiUrl)return res;

  try{
    await loadCatalog();
    const data=await res.clone().json();let changed=false,markerScene=null,narrative='';
    for(const field of ['reply','text'])if(typeof data?.[field]==='string'){
      narrative+=' '+data[field];
      data[field]=data[field].replace(/\s*\[\[SCENE:([A-Z]{3}-\d{3})\]\]\s*/gi,(_,id)=>{markerScene=String(id).toUpperCase();changed=true;return ' '}).trim();
    }
    if(markerScene)await setScene(markerScene);
    else{
      const inferred=inferSceneFromNarrative(narrative);
      if(inferred)await setScene(inferred);
    }
    if(changed){
      const headers=new Headers(res.headers);headers.set('Content-Type','application/json; charset=utf-8');
      return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers});
    }
  }catch(e){console.warn('Marcador visual não processado',e)}
  return res;
};

window.addEventListener('valedouro:quest-complete',()=>setTimeout(()=>render(),0));
const oldShow=window.show;
if(typeof oldShow==='function')window.show=function(id){const r=oldShow.apply(this,arguments);if(id==='game')setTimeout(()=>render(),0);return r};

async function init(){await loadCatalog();await render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

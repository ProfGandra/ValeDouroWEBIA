(()=>{
'use strict';
const KEY='valedouro.sceneVisual.v1';
const ASSETS={
  'QST-001':{
    'LOC-001':{src:'assets/quests/QST-001/qst001_loc001_saida_valedouro.png',alt:'Saída de Valedouro'},
    'LOC-002':{src:'assets/quests/QST-001/qst001_loc002_ultimo_ponto.png',alt:'Estrada comercial'},
    'LOC-003':{src:'assets/quests/QST-001/qst001_loc003_trecho_falha.png',alt:'Trecho acidentado da estrada'},
    'LOC-004':{src:'assets/quests/QST-001/qst001_loc004_caravana.png',alt:'Local da caravana'},
    'LOC-005':{src:'assets/quests/QST-001/qst001_loc005_rota_bandidos.png',alt:'Trilha próxima à estrada'},
    'LOC-006':{src:'assets/quests/QST-001/qst001_loc006_mata_aprendiz.png',alt:'Interior da floresta'},
    'LOC-007':{src:'assets/quests/QST-001/qst001_loc007_queda_aprendiz.png',alt:'Depressão rochosa na floresta'}
  }
};
function campaignQuest(){try{return window.ValeDouroCampaign?.read?.()?.currentQuestId||state?.hiddenQuest?.id||null}catch{return null}}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function write(v){localStorage.setItem(KEY,JSON.stringify(v));return v}
function valid(q,l){return !!ASSETS[q]?.[l]}
function ensureState(){const q=campaignQuest(),s=read();if(!q)return s;if(s.questId!==q){const first=ASSETS[q]?'LOC-001':null;return write({questId:q,locationId:first,updatedAt:new Date().toISOString()})}if(ASSETS[q]&&!valid(q,s.locationId))return write({questId:q,locationId:'LOC-001',updatedAt:new Date().toISOString()});return s}
function panel(){
  let p=document.getElementById('sceneVisual');
  const party=document.getElementById('party');
  if(!party)return p||null;
  if(!p){
    p=document.createElement('figure');
    p.id='sceneVisual';
    p.className='scene-visual';
    p.innerHTML='<img id="sceneVisualImg" alt=""><figcaption id="sceneVisualCaption"></figcaption>';
  }
  if(p.parentNode!==party.parentNode||p.previousElementSibling!==party)party.insertAdjacentElement('afterend',p);
  return p;
}
function installStyle(){if(document.getElementById('sceneVisualStyle'))return;const s=document.createElement('style');s.id='sceneVisualStyle';s.textContent='.scene-visual{display:none;width:100%;max-width:260px;margin:12px auto 14px;border:1px solid #4c3d2d;border-radius:10px;overflow:hidden;background:#17130f;box-shadow:0 5px 14px rgba(0,0,0,.28)}.scene-visual.active{display:block}.scene-visual img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#0d0b09}.scene-visual figcaption{padding:6px 8px;font-size:10px;line-height:1.25;color:#cdbfae;background:rgba(20,16,12,.96);text-align:center}.scene-visual+.scene-spacer{display:none}@media(max-width:800px){.scene-visual{max-width:220px;margin:10px auto 12px;border-radius:8px}.scene-visual figcaption{font-size:9px;padding:5px 7px}}';document.head.appendChild(s)}
function render(){installStyle();const p=panel();if(!p)return;const s=ensureState(),asset=ASSETS[s.questId]?.[s.locationId];if(!asset){p.classList.remove('active');return}const img=document.getElementById('sceneVisualImg'),cap=document.getElementById('sceneVisualCaption');if(img&&img.getAttribute('src')!==asset.src)img.src=asset.src;if(img)img.alt=asset.alt;if(cap)cap.textContent=asset.alt;p.classList.add('active')}
function setScene(locationId,questId=campaignQuest()){const q=questId;if(!valid(q,locationId))return false;const previous=read();if(previous.questId===q&&previous.locationId===locationId){render();return true}write({questId:q,locationId,updatedAt:new Date().toISOString()});render();window.dispatchEvent(new CustomEvent('valedouro:scene-change',{detail:{questId:q,locationId}}));return true}
function reset(){localStorage.removeItem(KEY);render()}
function sceneRule(q){if(!ASSETS[q])return null;return 'CONTROLE VISUAL DE CENA: quando a localização principal onde os personagens estão fisicamente mudar para uma location da quest atual, inclua ao final da resposta exatamente um marcador [[SCENE:LOC-XXX]] usando somente um ID existente em quest.locations. Não use o marcador apenas por mencionar, observar à distância ou investigar pistas sobre outro local. Na abertura da QST-001 use [[SCENE:LOC-001]]. O marcador é metadado interno e não deve ser explicado ao jogador.'}
window.ValeSceneVisuals={assets:ASSETS,read:ensureState,setScene,render,reset};
const previousFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  const aiUrl=(typeof AI_ENDPOINT!=='undefined'?AI_ENDPOINT:null);
  let nextInit=init;
  if(url===aiUrl){
    if(init?.method==='POST'&&init.body){try{const b=JSON.parse(init.body),q=campaignQuest(),rule=sceneRule(q);if(rule){b.world={...(b.world||{}),scene_visual_instruction:rule,current_visual_location:ensureState().locationId};if(b.quest)b.quest={...b.quest,visual_scene_directive:rule};b.state={...(b.state||{}),sceneVisual:{questId:q,locationId:ensureState().locationId},sceneVisualRules:[rule],capabilityRules:[...((b.state?.capabilityRules)||[]),rule]};nextInit={...init,body:JSON.stringify(b)}}}catch(e){console.warn('Regra visual não injetada',e)}}
  }
  const res=await previousFetch(input,nextInit);
  if(url!==aiUrl)return res;
  try{
    const data=await res.clone().json();let changed=false;
    for(const field of ['reply','text'])if(typeof data?.[field]==='string'){
      data[field]=data[field].replace(/\s*\[\[SCENE:(LOC-\d{3})\]\]\s*/gi,(_,loc)=>{setScene(String(loc).toUpperCase());changed=true;return ' '}).trim();
    }
    if(changed){const headers=new Headers(res.headers);headers.set('Content-Type','application/json; charset=utf-8');return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers})}
  }catch(e){console.warn('Marcador visual não processado',e)}
  return res;
};
window.addEventListener('valedouro:quest-complete',()=>setTimeout(render,0));
const oldShow=window.show;if(typeof oldShow==='function')window.show=function(id){const r=oldShow.apply(this,arguments);if(id==='game')setTimeout(render,0);return r};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();

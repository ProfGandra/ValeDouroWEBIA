(()=>{
'use strict';

const TEST_KEY='valedouro.seasonGate.preview.v1';
const FREE_KEY='valedouro.freeWorld.postT2.v1';
const HERO='assets/seasons/T3/season_03_mares_valedouro.png';
const FALLBACK='assets/valedouro-intro.png';

function campaign(){
  try{return window.ValeDouroCampaign?.read?.()||JSON.parse(localStorage.getItem('valedouro.campaign.v1')||'{}')}
  catch{return {}}
}
function hasSeason3License(){
  try{return window.ValeLicense?.hasSeason?.(3)===true}
  catch{return false}
}
function postT2(){const c=campaign();return c?.season2Complete===true&&!hasSeason3License()}
function previewing(){try{return sessionStorage.getItem(TEST_KEY)==='1'}catch{return false}}
function freeMode(){try{return postT2()&&(sessionStorage.getItem(FREE_KEY)==='1'||campaign()?.currentQuestId==null)}catch{return false}}

function style(){
  if(document.getElementById('valeSeasonGateStyle'))return;
  const s=document.createElement('style');s.id='valeSeasonGateStyle';
  s.textContent=`
  .vale-season-gate{position:fixed;inset:0;z-index:19000;display:none;background:#0c0a07;color:#f1e6d1}
  .vale-season-gate.active{display:flex;align-items:center;justify-content:center}
  .vale-season-stage{position:relative;width:100vw;height:100vh;overflow:hidden;background:#0c0a07}
  .vale-season-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center}
  .vale-season-vignette{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to bottom,rgba(0,0,0,.18),rgba(0,0,0,.02) 42%,rgba(0,0,0,.62)),radial-gradient(circle at center,transparent 48%,rgba(0,0,0,.32) 100%)}
  .vale-season-title{position:absolute;left:50%;top:5%;transform:translateX(-50%);width:min(900px,88vw);text-align:center;text-shadow:0 3px 16px rgba(0,0,0,.85)}
  .vale-season-title h1{margin:0;font-family:Georgia,serif;font-size:clamp(30px,4vw,62px);color:#f5e7c6;letter-spacing:.02em}
  .vale-season-title p{margin:8px 0 0;font-size:clamp(13px,1.5vw,20px);color:#eee0c6}
  .vale-hotspot{position:absolute;border:1px solid transparent;border-radius:20px;background:transparent;cursor:pointer;transition:.2s ease;outline:0}
  .vale-hotspot .vale-hot-label{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:190px;padding:11px 14px;border:1px solid rgba(235,194,103,.48);border-radius:12px;background:rgba(16,13,10,.82);backdrop-filter:blur(6px);box-shadow:0 8px 25px rgba(0,0,0,.38);opacity:0;transition:.2s ease;text-align:center;pointer-events:none}
  .vale-hotspot:hover,.vale-hotspot:focus-visible{border-color:rgba(235,194,103,.62);background:rgba(233,190,88,.08);box-shadow:inset 0 0 34px rgba(233,190,88,.12)}
  .vale-hotspot:hover .vale-hot-label,.vale-hotspot:focus-visible .vale-hot-label{opacity:1}
  .vale-hotspot.free{left:7%;top:24%;width:52%;height:57%}
  .vale-hotspot.premium{left:57%;top:25%;width:36%;height:58%}
  .vale-hotspot.premium:hover,.vale-hotspot.premium:focus-visible{border-color:rgba(119,187,255,.68);background:rgba(66,144,215,.08);box-shadow:inset 0 0 34px rgba(66,144,215,.14)}
  .vale-hotspot.premium .vale-hot-label{border-color:rgba(119,187,255,.55)}
  .vale-hot-label strong{display:block;font-family:Georgia,serif;color:#f3cd78;font-size:16px}.vale-hotspot.premium strong{color:#a9d6ff}.vale-hot-label span{display:block;margin-top:4px;font-size:12px;color:#e2d8c8}
  .vale-season-actions{position:absolute;left:50%;bottom:5%;transform:translateX(-50%);width:min(920px,92vw);display:flex;gap:14px;justify-content:center;align-items:stretch}
  .vale-season-btn{flex:1;min-height:68px;padding:13px 18px;border-radius:14px;border:1px solid rgba(226,185,91,.62);background:rgba(23,18,12,.9);color:#f3e4c4;box-shadow:0 8px 26px rgba(0,0,0,.4);backdrop-filter:blur(8px);cursor:pointer;font:700 16px Georgia,serif;letter-spacing:.02em}
  .vale-season-btn small{display:block;margin-top:5px;font:400 11px system-ui,sans-serif;color:#cfc3b0;letter-spacing:0}
  .vale-season-btn:hover{border-color:#efca72;background:rgba(36,27,16,.94)}
  .vale-season-btn.premium{border-color:rgba(111,185,255,.65);background:rgba(14,29,46,.92)}.vale-season-btn.premium:hover{border-color:#a7d6ff;background:rgba(17,42,67,.95)}
  .vale-season-preview{position:absolute;right:16px;top:14px;padding:7px 10px;border-radius:9px;background:rgba(0,0,0,.7);font-size:11px;color:#e6c36e}
  .vale-season-card{position:absolute;right:4%;top:50%;transform:translateY(-50%);width:min(390px,88vw);padding:24px;border:1px solid rgba(111,185,255,.6);border-radius:16px;background:rgba(10,20,32,.96);box-shadow:0 18px 60px rgba(0,0,0,.58);display:none;z-index:3}
  .vale-season-card.active{display:block}.vale-season-card h2{margin:0 0 3px;font:700 26px Georgia,serif;color:#b8dcff}.vale-season-card h3{margin:0 0 14px;font:700 16px Georgia,serif;color:#f2d18a}.vale-season-card p{line-height:1.5;color:#e2d9cc}.vale-season-card .lock{font-size:30px;margin-bottom:8px}.vale-season-card .row{display:flex;gap:10px;margin-top:16px}.vale-season-card button{flex:1}
  @media(max-width:760px){.vale-season-title{top:3%}.vale-season-title h1{font-size:30px}.vale-hotspot .vale-hot-label{display:none}.vale-season-actions{bottom:3%;flex-direction:column;gap:8px}.vale-season-btn{min-height:54px;font-size:14px}.vale-hotspot.free{left:2%;top:20%;width:56%;height:58%}.vale-hotspot.premium{left:55%;top:22%;width:43%;height:58%}.vale-season-card{left:50%;right:auto;top:50%;transform:translate(-50%,-50%)}}
  `;
  document.head.appendChild(s);
}

function ensure(){
  style();
  let g=document.getElementById('valeSeasonGate');if(g)return g;
  g=document.createElement('div');g.id='valeSeasonGate';g.className='vale-season-gate';g.setAttribute('aria-hidden','true');
  g.innerHTML=`<div class="vale-season-stage">
    <img id="valeSeasonBg" class="vale-season-bg" src="${HERO}" alt="ValeDouro vista a partir dos portões abertos do Liceu">
    <div class="vale-season-vignette"></div>
    <div class="vale-season-title"><h1>Os portões estão abertos.</h1><p>Sua história em ValeDouro continua.</p></div>
    <button class="vale-hotspot free" id="valeHotFree" type="button" aria-label="Continuar no mundo livre de ValeDouro"><span class="vale-hot-label"><strong>Mundo Livre</strong><span>Retorne aos lugares e personagens que você já conhece.</span></span></button>
    <button class="vale-hotspot premium" id="valeHotPremium" type="button" aria-label="Conhecer a Temporada III"><span class="vale-hot-label"><strong>🔒 Marés de ValeDouro</strong><span>Novos caminhos além do conteúdo já desbloqueado.</span></span></button>
    <div class="vale-season-actions"><button id="valeContinueFree" class="vale-season-btn" type="button">CONTINUAR EM VALEDOURO<small>Mundo Livre — locais, personagens e histórias já conhecidos</small></button><button id="valeDiscoverT3" class="vale-season-btn premium" type="button">🔒 DESCOBRIR MARÉS DE VALEDOURO<small>Temporada III — conteúdo adicional</small></button></div>
    <div id="valeSeasonPreview" class="vale-season-preview" style="display:none">MODO DE TESTE — progresso não alterado</div>
    <div id="valeSeasonCard" class="vale-season-card"><div class="lock">🔒</div><h2>Temporada III</h2><h3>Marés de ValeDouro</h3><p>Além dos lugares que você já conhece, novos caminhos aguardam. A Temporada III será disponibilizada como conteúdo adicional do ValeDouro Completo.</p><p><strong>Seu jogo-base continua normalmente.</strong> Você pode retornar ao Mundo Livre a qualquer momento.</p><div class="row"><button id="valeSeasonCardBack" class="vale-season-btn" type="button">Voltar</button></div></div>
  </div>`;
  document.body.appendChild(g);
  const bg=document.getElementById('valeSeasonBg');bg.addEventListener('error',()=>{if(!bg.dataset.fallback){bg.dataset.fallback='1';bg.src=FALLBACK}});
  document.getElementById('valeContinueFree').addEventListener('click',continueFree);
  document.getElementById('valeHotFree').addEventListener('click',continueFree);
  document.getElementById('valeDiscoverT3').addEventListener('click',showPremium);
  document.getElementById('valeHotPremium').addEventListener('click',showPremium);
  document.getElementById('valeSeasonCardBack').addEventListener('click',()=>document.getElementById('valeSeasonCard').classList.remove('active'));
  return g;
}

function open({preview=false}={}){
  const g=ensure();
  g.classList.add('active');g.setAttribute('aria-hidden','false');
  const badge=document.getElementById('valeSeasonPreview');badge.style.display=preview?'block':'none';
  document.getElementById('valeSeasonCard')?.classList.remove('active');
}
function close(){const g=ensure();g.classList.remove('active');g.setAttribute('aria-hidden','true')}
function showPremium(){document.getElementById('valeSeasonCard')?.classList.add('active')}

async function enterFreeWorld(){
  try{sessionStorage.setItem(FREE_KEY,'1')}catch{}
  close();
  if(previewing()){
    try{sessionStorage.removeItem(TEST_KEY)}catch{}
    return true;
  }
  try{
    if(typeof state!=='undefined')state.hiddenQuest=null;
    if(document.getElementById('game')?.classList.contains('active'))return true;
    if(typeof state!=='undefined'&&(!Array.isArray(state.characters)||!state.characters.length)&&typeof savedCharacters==='function')state.characters=savedCharacters();
    if(typeof state!=='undefined'&&(!state.characters||!state.characters.length)){
      alert('Nenhum personagem salvo foi encontrado para continuar o Mundo Livre.');
      if(typeof show==='function')show('opening');
      return false;
    }
    if(typeof renderParty==='function')renderParty();
    if(typeof selectPC==='function')selectPC(0);
    if(typeof show==='function')show('game');
    if(typeof addStory==='function')addStory('<strong>Mundo Livre</strong><br>Você concluiu a Temporada II. Os lugares, personagens e histórias que já conhece continuam disponíveis.','system');
    if(typeof askAI==='function')await askAI('Retome a sessão em MODO MUNDO LIVRE PÓS-T2. O grupo concluiu o conteúdo da Temporada II. Permita aventuras emergentes apenas em locais, personagens, fatos e recursos já conhecidos/desbloqueados nas Temporadas I e II. Não revele, antecipe, simule ou inicie conteúdo da Temporada III ou posterior. Convide os jogadores a decidir o que desejam fazer em ValeDouro dentro do mundo já conhecido.');
    return true;
  }catch(e){console.warn('Não foi possível entrar no Mundo Livre:',e);return false}
}
function continueFree(){return enterFreeWorld()}

function freeWorldRule(){return 'MODO MUNDO LIVRE PÓS-T2: o jogador concluiu as Temporadas I e II, mas não possui a Temporada III desbloqueada. Continue permitindo exploração, interpretação, conversas e aventuras emergentes usando SOMENTE locais, NPCs, fatos, recursos e conhecimentos já apresentados/desbloqueados nas Temporadas I e II. Não revele, antecipe, reproduza, resuma, simule nem inicie quests, locais exclusivos, acontecimentos, segredos ou descobertas da Temporada III ou posteriores. Não diga que a limitação existe por pagamento ou licença dentro da narrativa. Se o jogador tentar acessar conteúdo ainda não descoberto, redirecione naturalmente para possibilidades coerentes dentro do mundo já conhecido.'}
function installAIBridge(){
  if(window.__valeSeasonGateFetchInstalled)return;window.__valeSeasonGateFetchInstalled=true;
  const prev=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const aiUrl=(typeof AI_ENDPOINT!=='undefined'?AI_ENDPOINT:null);
    if(url===aiUrl&&init?.method==='POST'&&init.body&&freeMode()){
      try{const b=JSON.parse(init.body),rule=freeWorldRule();b.world={...(b.world||{}),free_world_instruction:rule};b.state={...(b.state||{}),freeWorldPostT2:true,seasonAccess:{1:true,2:true,3:false},capabilityRules:[...((b.state?.capabilityRules)||[]),rule]};init={...init,body:JSON.stringify(b)}}catch(e){console.warn('Regra de Mundo Livre não injetada',e)}
    }
    return prev(input,init);
  }
}

function test(){try{sessionStorage.setItem(TEST_KEY,'1')}catch{}open({preview:true});return 'Prévia da tela pós-T2 aberta sem alterar o progresso.'}
function exitTest(){try{sessionStorage.removeItem(TEST_KEY)}catch{}close();return true}

function init(){
  ensure();installAIBridge();
  window.addEventListener('valedouro:quest-complete',e=>{if(e?.detail?.completed==='QST-020')setTimeout(()=>open(),500)});
  if(previewing())open({preview:true});
  else if(postT2()&&campaign()?.currentQuestId==null)open();
}

window.ValeSeasonGate={open,close,test,exitTest,continueFree,showPremium,enterFreeWorld,isPostT2:postT2,isFreeWorld:freeMode,hero:HERO};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

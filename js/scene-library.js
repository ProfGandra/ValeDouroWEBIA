(function(){
  const DATA_URL='data/scenes.json';
  const state={registry:null,current:null};

  function byId(id){return document.getElementById(id);}
  function ext(path=''){const m=String(path).toLowerCase().match(/\.([a-z0-9]+)(?:\?.*)?$/);return m?m[1]:'';}
  function normalizeScene(scene){
    if(!scene||!scene.image)return null;
    const allowed=(state.registry&&state.registry.allowedExtensions)||['png','webp','jpg','jpeg'];
    if(!allowed.includes(ext(scene.image))) return null;
    return scene;
  }
  function render(scene){
    const frame=byId('sceneFrame'),img=byId('sceneImage'),empty=byId('sceneEmpty'),caption=byId('sceneCaption'),label=byId('sceneLabel');
    if(!frame||!img||!caption||!label)return;
    const next=normalizeScene(scene);
    frame.classList.add('scene-changing');
    setTimeout(()=>{
      if(!next){
        img.removeAttribute('src');img.alt='';frame.classList.remove('has-image');label.textContent='Cena atual';caption.textContent='Nenhuma cena carregada.';state.current=null;
      }else{
        img.src=next.image;img.alt=next.alt||next.title||'Cena atual de ValeDouro';label.textContent=next.title||'Cena atual';caption.innerHTML=next.location?'<strong>'+escapeHtml(next.location)+'</strong>'+(next.caption?' — '+escapeHtml(next.caption):''):(next.caption?escapeHtml(next.caption):'');frame.classList.add('has-image');state.current=next;
      }
      frame.classList.remove('scene-changing');
    },180);
  }
  function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function find(id){return state.registry&&state.registry.scenes?state.registry.scenes.find(s=>s.id===id):null;}
  function setScene(idOrScene){render(typeof idOrScene==='string'?find(idOrScene):idOrScene);}
  function clear(){render(null);}
  function openModal(){const modal=byId('sceneModal'),img=byId('sceneModalImage');if(!modal||!img||!state.current)return;img.src=state.current.image;img.alt=state.current.alt||state.current.title||'Cena ampliada';modal.classList.add('active');}
  function closeModal(){const modal=byId('sceneModal');if(modal)modal.classList.remove('active');}
  async function init(){
    try{const r=await fetch(DATA_URL,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);state.registry=await r.json();}
    catch(e){console.warn('[ValeScenes] Registro de cenas indisponível:',e);state.registry={allowedExtensions:['png','webp','jpg','jpeg'],scenes:[]};}
    const frame=byId('sceneFrame'),modal=byId('sceneModal'),close=byId('sceneModalClose');
    if(frame)frame.addEventListener('click',openModal);if(modal)modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});if(close)close.addEventListener('click',closeModal);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});render(null);
  }
  window.ValeScenes={init,set:setScene,clear,find,get current(){return state.current;},get registry(){return state.registry;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

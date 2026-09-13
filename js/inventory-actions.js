// ValeDouro WEBIA — ações funcionais do inventário
(function(){
'use strict';
if(window.__VALE_INVENTORY_ACTIONS__)return;
window.__VALE_INVENTORY_ACTIONS__=true;

function install(){
  const api=window.ValeInventory;
  if(!api||!window.state){setTimeout(install,150);return}
  if(api.__actionsFixed)return;
  api.__actionsFixed=true;

  const getChar=i=>window.state?.characters?.[Number.isInteger(i)?i:(window.state?.active||0)]||null;
  const findItem=(c,id)=>{
    try{
      const inv=api.ensure(c),items=[...(inv.items||[]),...(inv.resources||[])];
      return items.find(x=>x.id===id)||null;
    }catch{return null}
  };
  function notice(msg){
    let box=document.getElementById('valeInventoryNotice');
    if(!box){
      box=document.createElement('div');box.id='valeInventoryNotice';
      box.style.cssText='margin:8px 0;padding:8px 10px;border:1px solid rgba(215,178,93,.28);border-radius:8px;background:rgba(74,52,25,.14);color:#d8c28f;font-size:12px;';
      const content=document.getElementById('inventoryContent');content?.prepend(box);
    }
    box.textContent=msg;
  }
  function refresh(i,msg){
    if(typeof window.openInventory==='function')window.openInventory(i);
    if(msg)requestAnimationFrame(()=>notice(msg));
  }

  api.uiState=function(i,id,s){
    const c=getChar(i),it=c&&findItem(c,id);if(!c||!it)return false;
    if(s==='in-use'){
      const ok=api.setState(c,id,'in-use');if(!ok)return false;
      const action=document.getElementById('action');
      if(action){
        const phrase=`Uso ${it.name}.`;
        action.value=action.value?.trim()?`${action.value.trim()} ${phrase}`:phrase;
        action.focus();
      }
      window.closeInventory?.();
      if(typeof window.addStory==='function')window.addStory(`<strong>Sistema:</strong> ${window.esc?window.esc(it.name):it.name} preparado para uso. Descreva a ação e confirme em AGIR.`,'system');
      return true;
    }
    const ok=api.setState(c,id,s||'available');
    if(ok)refresh(i,s==='available'?`${it.name} foi guardado.`:`Estado de ${it.name} atualizado.`);
    return ok;
  };

  api.uiConsume=function(i,id){
    const c=getChar(i),it=c&&findItem(c,id);if(!c||!it)return false;
    const ok=api.consume(c,id,1);
    if(ok)refresh(i,`${it.name}: 1 unidade consumida.`);
    else refresh(i,`Não foi possível consumir ${it.name}.`);
    return ok;
  };

  api.uiSplit=function(i,id){
    const c=getChar(i),it=c&&findItem(c,id);if(!c||!it)return false;
    const raw=prompt(`Quanto de ${it.name} deseja separar?\nDisponível: ${it.qty} ${it.unit||''}`);
    if(raw===null)return false;
    const q=Number(String(raw).replace(',','.'));
    if(!Number.isFinite(q)||q<=0||q>=Number(it.qty)){
      refresh(i,'Informe uma quantidade maior que zero e menor que o total disponível.');
      return false;
    }
    const piece=api.split(c,id,q);
    if(piece)refresh(i,`${q} ${it.unit||''} de ${it.name} foram separados.`);
    return !!piece;
  };

  api.uiAbandon=function(i,id){
    const c=getChar(i),it=c&&findItem(c,id);if(!c||!it)return false;
    let qty=1;
    if(Number(it.qty)>1){
      const raw=prompt(`Quanto de ${it.name} deseja abandonar?\nDisponível: ${it.qty} ${it.unit||''}`,'1');
      if(raw===null)return false;
      qty=Number(String(raw).replace(',','.'));
      if(!Number.isFinite(qty)||qty<=0||qty>Number(it.qty)){refresh(i,'Quantidade inválida.');return false;}
    }
    if(!confirm(`Abandonar ${qty} ${it.unit||''} de ${it.name}?`))return false;
    const ok=api.remove(c,id,qty,'abandoned');
    if(ok)refresh(i,`${qty} ${it.unit||''} de ${it.name} foram abandonados.`);
    return ok;
  };
}
install();
})();
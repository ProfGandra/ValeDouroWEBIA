// ValeDouro WEBIA — Diário inicial de Patrulheiro/Ranger
(function(){
'use strict';
const JOURNAL_ITEM_ID='ranger-field-journal';
const JOURNAL_ITEM={
  id:JOURNAL_ITEM_ID,
  name:'Diário de Campo do Patrulheiro',
  qty:1,
  unit:'un',
  category:'Item de Jornada',
  state:'available',
  journalCapable:true,
  source:'Equipamento inicial de Patrulheiro',
  description:'Caderno resistente para anotações de trilha, observações, mapas, criaturas, técnicas e acontecimentos da jornada.'
};

function isRanger(c){
  return !!c&&((c.classes||[]).some(x=>/ranger|patrulheiro/i.test(x?.name||''))||/ranger|patrulheiro/i.test(c.cls||''));
}

function ensureJournalItem(c){
  if(!isRanger(c)||!window.ValeInventory?.ensure)return false;
  const inv=window.ValeInventory.ensure(c);
  inv.items=Array.isArray(inv.items)?inv.items:[];
  if(inv.items.some(x=>x.id===JOURNAL_ITEM_ID&&Number(x.qty||0)>0&&!['lost','abandoned'].includes(x.state)))return true;
  inv.items.push({...JOURNAL_ITEM});
  inv.history=Array.isArray(inv.history)?inv.history:[];
  inv.history.unshift({at:new Date().toISOString(),type:'ranger-starting-journal',item:JOURNAL_ITEM_ID,qty:1});
  window.ValeInventory.persist?.(c);
  return true;
}

function ensureBound(c){
  if(!isRanger(c)||!ensureJournalItem(c)||!window.ValeJournal)return;
  const j=window.ValeJournal.stateFor?.(c);
  if(j?.active)return;
  window.ValeJournal.bind?.(c,JOURNAL_ITEM_ID);
}

function reconcile(){
  const chars=window.state?.characters||[];
  chars.forEach(c=>{if(isRanger(c))ensureJournalItem(c)});
  chars.forEach(c=>{if(isRanger(c))ensureBound(c)});
  window.ValeJournal?.syncButton?.();
}

window.ValeRangerJournal={reconcile,ensureJournalItem,ensureBound,JOURNAL_ITEM_ID};
window.addEventListener('valedouro:inventory-change',()=>setTimeout(reconcile,0));
window.addEventListener('valedouro:journal-change',()=>setTimeout(()=>window.ValeJournal?.syncButton?.(),0));
window.addEventListener('DOMContentLoaded',()=>setTimeout(reconcile,250));
window.addEventListener('load',()=>setTimeout(reconcile,500));
setTimeout(reconcile,900);
})();

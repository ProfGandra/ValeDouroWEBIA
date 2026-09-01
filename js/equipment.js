let VD_EQUIPMENT=[];
const equipmentSelections={};

function ensureEquipmentSelection(i){
  if(!equipmentSelections[i]) equipmentSelections[i]=new Set();
  return equipmentSelections[i];
}

function currentSlotClasses(i){
  return [$(`c1${i}`)?.value,$(`c2${i}`)?.value].filter(Boolean);
}

function equipmentCompat(i,item){
  const classes=currentSlotClasses(i);
  const attrs=creationRolls[i]?.attrs||{};
  const classOk=(item.classes||[]).some(c=>classes.includes(c));
  const str=Number(attrs.FOR||0),dex=Number(attrs.DES||0);
  const statOk=(!item.minStr||str>=item.minStr)&&(!item.minDex||dex>=item.minDex);
  let why='Compatível';
  if(!classOk) why='Classe sem proficiência inicial';
  else if(!statOk){
    const req=[];
    if(item.minStr) req.push(`FOR ${item.minStr}`);
    if(item.minDex) req.push(`DES ${item.minDex}`);
    why=`Requer ${req.join(' / ')}`;
  }
  return {ok:classOk&&statOk,why};
}

function renderEquipmentForSlot(i){
  const host=$(`equipmentGrid${i}`);
  if(!host) return;
  if(!VD_EQUIPMENT.length){
    host.innerHTML='<p class="muted">Carregando equipamentos…</p>';
    return;
  }
  const selected=ensureEquipmentSelection(i);
  host.innerHTML=VD_EQUIPMENT.map(item=>{
    const c=equipmentCompat(i,item),isSelected=selected.has(item.id);
    return `<article class="equipment-card ${isSelected?'selected':''} ${c.ok?'':'blocked'}">
      <img src="${esc(item.image)}" alt="${esc(item.name)}">
      <div class="equipment-body">
        <h4>${esc(item.icon||'')} ${esc(item.name)}</h4>
        <div class="muted">${esc(item.cat||'')}</div>
        <p><strong>${esc(item.stats||'')}</strong></p>
        <p><small>Peso: ${esc(item.weight||'—')}<br>${esc(item.req||'')}</small></p>
        <p class="${c.ok?'equipment-ok':'equipment-bad'}">${c.ok?'✓':'⚠'} ${esc(c.why)}</p>
        <button class="btn small" ${c.ok?'':'disabled'} onclick="toggleEquipment(${i},'${item.id}')">${isSelected?'REMOVER':'EQUIPAR'}</button>
      </div>
    </article>`;
  }).join('');
  const count=$(`equipmentCount${i}`);
  if(count) count.textContent=`${selected.size} item(ns) selecionado(s)`;
}

function toggleEquipment(i,id){
  const item=VD_EQUIPMENT.find(x=>x.id===id);
  if(!item||!equipmentCompat(i,item).ok) return;
  const selected=ensureEquipmentSelection(i);
  selected.has(id)?selected.delete(id):selected.add(id);
  renderEquipmentForSlot(i);
}

function deriveDefenseFromEquipment(ids){
  let armor='Nenhuma';
  if(ids.includes('chain')) armor='Cota de malha';
  else if(ids.includes('leather')) armor='Couro';
  return {armor,shield:ids.includes('shield')};
}

const baseRenderCreateSlot=renderCreateSlot;
renderCreateSlot=function(i){
  baseRenderCreateSlot(i);
  const armor=$(`armor${i}`);
  if(armor){
    const defensiveRow=armor.closest('.row');
    if(defensiveRow) defensiveRow.style.display='none';
  }
  const body=$(`slotBody${i}`);
  if(!body) return;
  body.insertAdjacentHTML('beforeend',`<section class="equipment-builder">
    <div class="equipment-head">
      <div><h4>Equipamentos iniciais</h4><p class="muted">Escolha apenas itens compatíveis com as classes e atributos deste personagem.</p></div>
      <span id="equipmentCount${i}" class="equipment-count"></span>
    </div>
    <div id="equipmentGrid${i}" class="equipment-grid"></div>
  </section>`);
  [$(`c1${i}`),$(`c2${i}`)].forEach(sel=>{
    if(sel) sel.addEventListener('change',()=>renderEquipmentForSlot(i));
  });
  renderEquipmentForSlot(i);
};

const baseSetSlotMode=setSlotMode;
setSlotMode=function(i,mode){
  baseSetSlotMode(i,mode);
  if(mode==='create') ensureEquipmentSelection(i);
};

const basePlayerCount=playerCount;
playerCount=function(){
  const n=+$('playerCount').value;
  Object.keys(equipmentSelections).forEach(k=>{if(+k>=n) delete equipmentSelections[k]});
  basePlayerCount();
};

collectChars=function(){
  const n=+$('playerCount').value,result=[],saved=savedCharacters();
  for(let i=0;i<n;i++){
    if(slotModes[i]==='load'){
      const c=saved[+$(`saved${i}`)?.value||0];
      if(!c){alert(`Selecione uma ficha salva para o Personagem ${i+1}.`);return;}
      result.push(JSON.parse(JSON.stringify(c)));
      continue;
    }
    const r=creationRolls[i];
    if(!r||r.index<abilities.length){alert(`Role os seis atributos do Personagem ${i+1}.`);return;}
    const l1=Math.max(1,+$(`l1${i}`).value||1),c2=$(`c2${i}`).value,l2=+$(`l2${i}`).value||0;
    if(l1+l2>20){alert(`O nível total do Personagem ${i+1} não pode ultrapassar 20.`);return;}
    if(c2&&c2===$(`c1${i}`).value){alert(`Escolha classes diferentes para o Personagem ${i+1}.`);return;}
    const name=$(`name${i}`).value.trim();
    if(!name){alert(`Informe o nome do Personagem ${i+1}.`);return;}
    const classes=[{name:$(`c1${i}`).value,level:l1}];
    if(c2&&l2>0) classes.push({name:c2,level:l2});
    const equipment=[...ensureEquipmentSelection(i)];
    const defense=deriveDefenseFromEquipment(equipment);
    result.push(calc({
      name,
      race:$(`race${i}`).value,
      background:$(`bg${i}`).value,
      classes,
      attrs:{...r.attrs},
      equipment,
      armor:defense.armor,
      shield:defense.shield
    }));
  }
  state.characters=result;
  saveChars();
  showReview();
};

const baseSheet=sheet;
sheet=function(c){
  const base=baseSheet(c);
  const ids=Array.isArray(c.equipment)?c.equipment:[];
  const names=ids.map(id=>VD_EQUIPMENT.find(x=>x.id===id)?.name||id);
  return base+`<div class="sheet-section equipment-sheet"><h4>Equipamentos</h4><p>${names.length?names.map(esc).join(' • '):'Nenhum equipamento selecionado'}</p></div>`;
};

partyForAI=function(){
  return state.characters.map(c=>({
    name:c.name,
    race:c.race,
    background:c.background,
    classes:c.classes,
    attributes:c.attrs,
    armor:c.armor,
    shield:c.shield,
    equipment:(c.equipment||[]).map(id=>VD_EQUIPMENT.find(x=>x.id===id)?.name||id),
    ca:c.ca,
    hp:c.hp,
    hpMax:c.hpMax
  }));
};

async function loadEquipmentData(){
  try{
    VD_EQUIPMENT=await fetch('data/equipment.json').then(r=>{
      if(!r.ok) throw new Error('Falha ao carregar equipment.json');
      return r.json();
    });
    const n=+$('playerCount')?.value||1;
    for(let i=0;i<n;i++) renderEquipmentForSlot(i);
  }catch(e){
    console.error('Equipamentos indisponíveis',e);
  }
}

window.addEventListener('DOMContentLoaded',loadEquipmentData);

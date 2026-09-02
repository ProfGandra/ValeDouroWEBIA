// ValeDouro WEBIA — ficha viva do jogador
(function(){
  const avatarDrafts={};
  const oldRenderCreateSlot=renderCreateSlot;
  renderCreateSlot=function(i){
    oldRenderCreateSlot(i);
    const body=$(`slotBody${i}`); if(!body) return;
    body.insertAdjacentHTML('beforeend',`<section class="avatar-builder"><h4>Avatar do personagem</h4><p class="muted">Envie uma imagem para aparecer na ficha. Ela será reduzida e salva junto ao personagem.</p><div class="avatar-line"><img id="avatarPreview${i}" class="avatar-preview" src="${esc(avatarDrafts[i]||'')}" alt="Avatar"><div><input type="file" accept="image/*" onchange="loadAvatar(${i},this.files[0])"><button class="btn small" type="button" onclick="clearAvatar(${i})">Remover avatar</button></div></div></section>`);
  };

  window.loadAvatar=function(i,file){
    if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const size=512,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
        const ctx=canvas.getContext('2d');ctx.fillStyle='#d9ccb2';ctx.fillRect(0,0,size,size);
        const scale=Math.max(size/img.width,size/img.height),w=img.width*scale,h=img.height*scale;
        ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);
        avatarDrafts[i]=canvas.toDataURL('image/jpeg',0.82);
        const p=$(`avatarPreview${i}`);if(p)p.src=avatarDrafts[i];
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  };
  window.clearAvatar=function(i){avatarDrafts[i]='';const p=$(`avatarPreview${i}`);if(p)p.removeAttribute('src');};

  function normalize(c){
    c.xp=Number(c.xp||0);c.bonusPoints=Number(c.bonusPoints||0);c.coins=c.coins||{gold:0,silver:0,copper:0};
    c.inventory=Array.isArray(c.inventory)?c.inventory:[];c.rewards=Array.isArray(c.rewards)?c.rewards:[];
    c.validated=!!c.validated;c.avatar=c.avatar||'';return c;
  }

  const oldCollect=collectChars;
  collectChars=function(){
    oldCollect();
    if(!$('review').classList.contains('active')) return;
    state.characters.forEach((c,i)=>{normalize(c);if(slotModes[i]!=='load'){c.avatar=avatarDrafts[i]||c.avatar||'';c.validated=false;}});
    saveChars();showReview();
  };

  function equipmentRows(c){
    const rows=(c.equipment||[]).map(id=>{const e=typeof VD_EQUIPMENT!=='undefined'?VD_EQUIPMENT.find(x=>x.id===id):null;return {name:e?.name||id,qty:1,note:e?.stats||''};});
    (c.inventory||[]).forEach(x=>rows.push({name:x.name||x.item||'Item',qty:x.qty||1,note:x.note||x.notes||'Recompensa'}));
    return rows;
  }

  function liveSheet(c){
    normalize(c);const rows=equipmentRows(c),cl1=c.classes?.[0],cl2=c.classes?.[1];
    return `<div class="vd-sheet"><div class="vd-sheet-head"><img class="vd-sheet-avatar" src="${esc(c.avatar||'')}" alt="Avatar"><div class="vd-sheet-title"><h2>VALEDOURO</h2><p><strong>FICHA DE PERSONAGEM — VD-SHEET-V1</strong></p><p><strong>${esc(c.name)}</strong> • ${esc(c.race||'—')} • ${esc(c.cls||'—')}</p><p>Nível ${c.level||1} • XP ${c.xp||0} • Bônus ${c.bonusPoints||0}</p></div></div><div class="vd-sheet-grid"><section class="vd-box"><h4>Identidade do personagem</h4><p><b>Nome:</b> ${esc(c.name)}<br><b>Jogador:</b> ${esc(c.playerName||'—')}<br><b>Classe 1:</b> ${esc(cl1?.name||'—')} ${cl1?.level||''}<br><b>Classe 2:</b> ${esc(cl2?.name||'—')} ${cl2?.level||''}<br><b>Antecedente:</b> ${esc(c.background||'—')}</p></section><section class="vd-box"><h4>Combate</h4><p><b>CA:</b> ${c.ca} • <b>PV:</b> ${c.hp}/${c.hpMax}<br><b>Iniciativa:</b> ${fmt(c.ini||0)} • <b>Deslocamento:</b> ${c.speed||9} m<br><b>Proficiência:</b> ${fmt(c.prof||2)} • <b>Dados de Vida:</b> ${esc(c.hitDice||'—')}</p></section></div><section class="vd-box" style="margin-top:10px"><h4>Atributos</h4><div class="vd-attrs">${abilities.map(a=>`<div class="vd-attr"><small>${a}</small><b>${c.attrs?.[a]??'—'}</b><span>${fmt(mod(c.attrs?.[a]||10))}</span></div>`).join('')}</div></section><div class="vd-sheet-grid"><section class="vd-box"><h4>Equipamentos e inventário</h4><table class="vd-items"><thead><tr><th>Item</th><th>Qtd.</th><th>Observações</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${r.qty}</td><td>${esc(r.note||'')}</td></tr>`).join(''):'<tr><td colspan="3">Nenhum item registrado</td></tr>'}</tbody></table></section><section class="vd-box"><h4>Progressão e recompensas</h4><p><b>XP:</b> ${c.xp||0}<br><b>Pontos bônus:</b> ${c.bonusPoints||0}<br><b>Moedas:</b> ${c.coins.gold||0} PO • ${c.coins.silver||0} PA • ${c.coins.copper||0} PC</p><p><b>Conquistas:</b><br>${(c.rewards||[]).length?(c.rewards||[]).map(x=>esc(x.label||x.name||String(x))).join('<br>'):'—'}</p></section></div><div class="vd-validation"><b>VALIDAÇÃO VALEDOURO:</b> <span class="${c.validated?'vd-valid':'vd-pending'}">${c.validated?'FICHA VALIDADA':'AGUARDANDO VALIDAÇÃO DO JOGADOR'}</span></div></div>`;
  }

  sheet=function(c){return liveSheet(c)};
  showReview=function(){
    $('reviewCards').innerHTML=state.characters.map((c,i)=>`<div class="char-card">${liveSheet(c)}<div class="sheet-actions no-print"><button class="btn primary" onclick="validateSheet(${i})">${c.validated?'✓ Ficha validada':'VALIDAR FICHA'}</button><button class="btn" ${c.validated?'':'disabled'} onclick="downloadSheetPDF(${i})">GERAR / SALVAR PDF</button><button class="btn" onclick="openSheet(${i})">Abrir ficha</button></div></div>`).join('');
    show('review');
  };
  openSheet=function(i){$('sheetContent').innerHTML=liveSheet(state.characters[i])+`<div class="sheet-actions no-print"><button class="btn primary" onclick="validateSheet(${i})">VALIDAR FICHA</button><button class="btn" ${state.characters[i]?.validated?'':'disabled'} onclick="downloadSheetPDF(${i})">GERAR / SALVAR PDF</button></div>`;$('sheetModal').classList.add('active')};
  window.validateSheet=function(i){const c=normalize(state.characters[i]);c.validated=true;c.validatedAt=new Date().toISOString();saveChars();showReview();};

  function printDocumentMarkup(c){
    const sheetHtml=liveSheet(c);
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Ficha - ${esc(c.name)}</title><style>
      @page{size:A4 portrait;margin:10mm}
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;background:#fff;color:#2a2118;font-family:Georgia,'Times New Roman',serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      body{width:190mm;margin:0 auto}
      .vd-sheet{width:100%;background:#fff;color:#2a2118;border:0;padding:0;box-shadow:none}
      .vd-sheet-head{display:grid;grid-template-columns:28mm 1fr;gap:5mm;align-items:center;border-bottom:1.2pt solid #9c7b43;padding-bottom:3mm;margin-bottom:3mm;break-inside:avoid}
      .vd-sheet-avatar{width:28mm;height:28mm;object-fit:cover;border:1pt solid #9c7b43;border-radius:2mm;background:#d9ccb2}
      .vd-sheet-title h2{margin:0 0 1mm;color:#5c421f;font-size:18pt;letter-spacing:.08em;line-height:1.05}
      .vd-sheet-title p{margin:.7mm 0;font-size:9.5pt;line-height:1.18}
      .vd-sheet-grid{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-top:3mm;align-items:start}
      .vd-box{border:.7pt solid #b79b69;border-radius:2mm;padding:2.5mm;background:#fff;break-inside:avoid}
      .vd-box h4{margin:0 0 1.8mm;color:#6b4b22;font-size:10.5pt}
      .vd-box p{margin:0;font-size:9pt;line-height:1.25}
      .vd-attrs{display:grid;grid-template-columns:repeat(6,1fr);gap:1.5mm}
      .vd-attr{text-align:center;border:.6pt solid #c8b184;border-radius:1.5mm;padding:1.5mm;background:#fff;break-inside:avoid}
      .vd-attr small{font-size:7.5pt}.vd-attr b{display:block;font-size:15pt;line-height:1.05;margin:.5mm 0}.vd-attr span{font-size:8.5pt}
      .vd-items{width:100%;border-collapse:collapse;table-layout:fixed}
      .vd-items th,.vd-items td{border-bottom:.5pt solid #d2c09c;padding:1.2mm 1mm;text-align:left;font-size:7.6pt;line-height:1.15;vertical-align:top;word-wrap:break-word}
      .vd-items th:nth-child(1),.vd-items td:nth-child(1){width:34%}.vd-items th:nth-child(2),.vd-items td:nth-child(2){width:12%;text-align:center}.vd-items th:nth-child(3),.vd-items td:nth-child(3){width:54%}
      .vd-items thead{display:table-header-group}.vd-items tr{break-inside:avoid}
      .vd-validation{margin-top:3mm;padding:2mm;border:.8pt dashed #9c7b43;border-radius:2mm;font-size:9.5pt;break-inside:avoid}
      .vd-valid{color:#507b41;font-weight:700}.vd-pending{color:#9b6d24;font-weight:700}
      @media print{body{width:auto;margin:0}.vd-sheet-grid{grid-template-columns:1fr 1fr!important}.vd-attrs{grid-template-columns:repeat(6,1fr)!important}}
    </style></head><body>${sheetHtml}<script>window.onload=function(){setTimeout(function(){window.print()},250)};<\/script></body></html>`;
  }

  window.downloadSheetPDF=function(i){
    const c=normalize(state.characters[i]);
    if(!c.validated)return alert('Valide a ficha antes de gerar o PDF.');
    const w=window.open('','_blank','width=980,height=900');
    if(!w)return alert('O navegador bloqueou a janela de impressão. Permita pop-ups para gerar a ficha PDF.');
    w.document.open();
    w.document.write(printDocumentMarkup(c));
    w.document.close();
  };

  const oldStart=startAdventure;
  startAdventure=async function(){if(state.characters.some(c=>!normalize(c).validated))return alert('Valide todas as fichas antes de iniciar a aventura.');return oldStart();};

  window.applyCharacterReward=function(index,reward){
    const c=normalize(state.characters[index]);if(!c)return;
    if(reward.type==='xp')c.xp+=Number(reward.value||0);
    else if(reward.type==='bonus')c.bonusPoints+=Number(reward.value||0);
    else if(reward.type==='gold')c.coins.gold+=Number(reward.value||0);
    else if(reward.type==='silver')c.coins.silver+=Number(reward.value||0);
    else if(reward.type==='copper')c.coins.copper+=Number(reward.value||0);
    else if(reward.type==='item')c.inventory.push({name:reward.name||'Item',qty:Number(reward.qty||1),note:reward.note||'Obtido em aventura'});
    else c.rewards.push({label:reward.label||reward.name||String(reward)});
    c.validated=true;saveChars();renderParty();
    const msg=`Ficha atualizada: ${reward.name||reward.label||reward.type}.`;
    if($('story')) addStory(`<div class="reward-toast">${esc(msg)}</div>`,'system');
  };
})();
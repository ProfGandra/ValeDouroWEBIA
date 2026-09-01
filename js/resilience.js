// ValeDouro WEBIA — resiliência de IA, compactação de contexto e continuidade narrativa
(function(){
  function compactText(value,max=420){
    const s=String(value??'');
    return s.length>max?s.slice(0,max)+'…':s;
  }

  function compactHistory(){
    if(!Array.isArray(state.history)) return [];
    return state.history.slice(-2).map(x=>({
      role:x?.role||'user',
      content:compactText(x?.content||'',500)
    }));
  }

  function compactQuest(){
    const q=state.hiddenQuest;
    if(!q||typeof q!=='object') return {};

    const preferredKeys=[
      'title','name','summary','description','objective','objectives',
      'current','stage','state','status','hook','hooks','npcs','locations',
      'clues','events','outcomes','secrets'
    ];

    const out={};
    for(const key of preferredKeys){
      if(!(key in q)) continue;
      const v=q[key];
      if(typeof v==='string') out[key]=compactText(v,320);
      else if(Array.isArray(v)) out[key]=v.slice(0,2).map(item=>{
        if(typeof item==='string') return compactText(item,220);
        if(item&&typeof item==='object'){
          const mini={};
          for(const [k,val] of Object.entries(item).slice(0,4)){
            mini[k]=typeof val==='string'?compactText(val,180):val;
          }
          return mini;
        }
        return item;
      });
      else if(v&&typeof v==='object'){
        const mini={};
        for(const [k,val] of Object.entries(v).slice(0,5)){
          mini[k]=typeof val==='string'?compactText(val,220):val;
        }
        out[key]=mini;
      }else out[key]=v;
    }

    // Caso a quest use outros nomes de campos, preserva um pequeno recorte útil.
    if(!Object.keys(out).length){
      for(const [k,v] of Object.entries(q).slice(0,6)){
        if(typeof v==='string') out[k]=compactText(v,260);
        else if(Array.isArray(v)) out[k]=v.slice(0,2);
        else if(v&&typeof v==='object') out[k]=Object.fromEntries(Object.entries(v).slice(0,3));
        else out[k]=v;
      }
    }
    return out;
  }

  function compactParty(){
    return state.characters.map(c=>({
      name:c.name,
      race:c.race,
      classes:(c.classes||[]).map(x=>({name:x.name,level:x.level})),
      attributes:c.attrs,
      ca:c.ca,
      hp:c.hp,
      hpMax:c.hpMax,
      equipment:(c.equipment||[]).map(id=>{
        if(typeof VD_EQUIPMENT!=='undefined') return VD_EQUIPMENT.find(x=>x.id===id)?.name||id;
        return id;
      }).slice(0,8)
    }));
  }

  function continuityDirective(){
    return 'Mantenha continuidade estrita: não contradiga fatos recentes, não confunda NPCs e não altere o estado de alguém sem causa narrada. Use a quest apenas como bastidor.';
  }

  function buildPayload(action){
    const active=state.characters[state.active];
    return {
      action:`${compactText(action,900)}\n\n${continuityDirective()}`,
      player:{active_character:active?.name,party:compactParty()},
      quest:compactQuest(),
      world:{quests_hidden:true,multiplayer:state.characters.length>1},
      history:compactHistory()
    };
  }

  function clearRetryCard(){
    const old=document.getElementById('aiRetryCard');
    if(old) old.remove();
  }

  function showRetryCard(message){
    clearRetryCard();
    const d=document.createElement('div');
    d.id='aiRetryCard';
    d.className='entry system';
    d.innerHTML=`<b>Mestre:</b> ${esc(message)}<br><button class="btn small" style="margin-top:8px" onclick="retryLastAI()">TENTAR CONTINUAR</button>`;
    $('story').appendChild(d);
    $('story').scrollTop=$('story').scrollHeight;
  }

  window.retryLastAI=async function(){
    if(!state.lastRetryAction) return;
    clearRetryCard();
    await window.askAI(state.lastRetryAction,true);
  };

  window.askAI=async function(action,isRetry=false){
    $('actBtn').disabled=true;
    const wait=addStory('<b>Mestre:</b> pensando…','master');
    try{
      const payload=buildPayload(action);
      const r=await fetch(AI_ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      let d={};
      try{ d=await r.json(); }catch{}
      if(!r.ok||!d.ok){
        const status=d.provider_status||r.status;
        const err=new Error(d.error||'Falha na IA');
        err.providerStatus=status;
        throw err;
      }

      wait.remove();
      clearRetryCard();
      state.lastRetryAction=null;

      const text=d.reply||'';
      state.history.push({role:'assistant',content:text});
      // Mantemos a resposta integral recebida. Não fazemos corte de texto no front-end.
      const clean=text.replace(/\[\[ROLL:[^\]]+\]\]/g,'').trim();
      addStory(`<b>Mestre:</b> ${esc(clean).replace(/\n/g,'<br>')}`,'master');

      const m=text.match(/\[\[ROLL:(FOR|DES|CON|INT|SAB|CAR):(\d+):([^\]]+)\]\]/);
      if(m) requestRoll(m[1],+m[2],m[3]);

      if(state.lastRollAwaitingNarration){
        state.lastRollAwaitingNarration=false;
        setTimeout(()=>$('rollbox').classList.remove('active'),700);
      }
    }catch(e){
      wait.remove();
      state.lastRetryAction=action;
      if(Number(e.providerStatus)===429){
        showRetryCard('O Mestre atingiu temporariamente o limite de uso da IA. A ação e qualquer rolagem já realizada foram preservadas. Aguarde alguns segundos e clique em TENTAR CONTINUAR.');
      }else{
        showRetryCard(`Falha temporária ao consultar o Mestre Virtual. A ação foi preservada. ${e.message||''}`.trim());
      }
    }finally{
      $('actBtn').disabled=!!state.pendingCheck;
    }
  };

  window.rollCheck=async function(){
    const r=state.pendingCheck;
    if(!r) return;
    const p=state.characters[r.playerIndex];
    const d20=1+Math.floor(Math.random()*20);
    const bonus=mod(p.attrs[r.attr]);
    const total=d20+bonus;
    const success=total>=r.cd;

    $('die').textContent=d20;
    $('rollResult').innerHTML=`${esc(p.name)}: ${r.attr} ${fmt(bonus)} = <strong>${total}</strong> vs CD ${r.cd} — <span class="${success?'pass':'fail'}">${success?'SUCESSO':'FALHA'}</span>`;
    $('rollBtn').disabled=true;
    addStory(`<b>Rolagem de ${esc(p.name)}:</b> d20 ${d20} ${fmt(bonus)} = ${total} vs CD ${r.cd} — ${success?'SUCESSO':'FALHA'}`,'system');

    const msg=`Resultado do teste de ${p.name}: ${r.attr}; d20 ${d20}; mod ${bonus}; total ${total}; CD ${r.cd}; ${success?'sucesso':'falha'}; motivo: ${compactText(r.motivo,220)}. Narre a consequência e continue.`;
    state.history.push({role:'user',content:msg});
    state.pendingCheck=null;
    state.lastRollAwaitingNarration=true;
    state.lastRetryAction=msg;
    await window.askAI(msg,false);
  };
})();

// ValeDouro WEBIA — resiliência de IA, compactação de contexto e continuidade narrativa
(function(){
  function compactValue(value, depth=0){
    if(value==null) return value;
    if(typeof value==='string') return value.length>600?value.slice(0,600)+'…':value;
    if(typeof value==='number'||typeof value==='boolean') return value;
    if(depth>=2) return Array.isArray(value)?`[${value.length} itens]`:'[resumido]';
    if(Array.isArray(value)) return value.slice(0,4).map(v=>compactValue(v,depth+1));
    if(typeof value==='object'){
      const out={};
      for(const [k,v] of Object.entries(value).slice(0,12)) out[k]=compactValue(v,depth+1);
      return out;
    }
    return String(value);
  }

  function compactHistory(){
    if(!Array.isArray(state.history)) return [];
    return state.history.slice(-4).map(x=>({
      role:x?.role||'user',
      content:String(x?.content||'').slice(0,900)
    }));
  }

  function compactQuest(){
    return compactValue(state.hiddenQuest||{},0);
  }

  function continuityDirective(){
    return [
      'Mantenha coerência absoluta com os fatos já estabelecidos na cena.',
      'Não faça um NPC aparecer, desaparecer, fugir, morrer, ser capturado ou se ferir de forma incompatível com o histórico recente.',
      'Não confunda dois NPCs diferentes.',
      'Se houver dúvida sobre um detalhe, não invente algo que contradiga a cena.',
      'Use a quest interna apenas como referência de bastidores; não misture estados de momentos diferentes da quest.'
    ].join(' ');
  }

  function buildPayload(action){
    const active=state.characters[state.active];
    const party=(typeof partyForAI==='function'?partyForAI():state.characters).map(p=>compactValue(p,0));
    return {
      action:`${action}\n\nDIRETRIZ DE CONTINUIDADE: ${continuityDirective()}`,
      player:{active_character:active?.name,party},
      quest:compactQuest(),
      world:{
        rule:'quests_hidden_from_player',
        multiplayer:state.characters.length>1,
        continuity:true
      },
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
    const msg=`Resultado do teste solicitado para ${p.name}: ${r.attr}, d20=${d20}, modificador=${bonus}, total=${total}, CD=${r.cd}, resultado=${success?'sucesso':'falha'}, motivo=${r.motivo}. Narre a consequência e continue a cena.`;
    state.history.push({role:'user',content:msg});
    state.pendingCheck=null;
    state.lastRollAwaitingNarration=true;
    state.lastRetryAction=msg;
    await window.askAI(msg,false);
  };
})();

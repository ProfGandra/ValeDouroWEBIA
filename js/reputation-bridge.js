// ValeDouro WEBIA — ponte narrativa de reputação/consequências -> Mestre + Diário
(function(){
'use strict';
if(window.__VALE_REPUTATION_BRIDGE__) return;
window.__VALE_REPUTATION_BRIDGE__=true;

const CONTRACT = [
  'SISTEMA DE CONSEQUÊNCIAS DE VALEDOURO:',
  'Reputação é alterada por DECISÕES do personagem, nunca pelo valor ou sucesso/falha de uma rolagem. A rolagem apenas resolve incerteza e pode determinar se o ato foi percebido, evitado ou consumado.',
  'DECLARAÇÃO DO JOGADOR NÃO É FATO DO MUNDO. Alegações, mentiras, acusações, parentescos, mortes, objetos ou eventos mencionados pelo jogador permanecem apenas alegações até que existam no estado canônico ou sejam confirmados pela narrativa. Nunca materialize um cadáver, vítima, crime ou passado apenas porque o jogador afirmou que existe.',
  'Quando o jogador tomar uma decisão deliberada com consequência social, moral ou legal relevante, registre-a ao final da resposta com UM marcador oculto [[REPUTATION:{JSON}]]. O marcador não deve ser explicado ao jogador.',
  'Use JSON simples, sem arrays. Campos permitidos: type, description, deliberate, witnessed, known, factionChanges, relationChanges, legal, journal.',
  'Tipos preferidos: theft, assault, killing, threat, vandalism, betrayal, aid, surrender, deception.',
  'witnessed=true somente se alguém realmente presenciou o ato. known=true somente se a instituição/comunidade já tem conhecimento. Alterações de reputação pública só devem existir quando o mundo tem motivo plausível para conhecer a decisão.',
  'legal deve usar {"jurisdiction":"ValeDouro","status":"...","crimeKnown":true|false,"identified":true|false,"severity":N} quando houver consequência legal.',
  'journal pode usar {"title":"...","body":"..."}. Sempre forneça journal para decisões negativas ou moralmente marcantes, escrito em primeira pessoa como memória do personagem, sem mencionar dados, CD, pontos ou mecânicas.',
  'Exemplo de assalto público frustrado: [[REPUTATION:{"type":"theft","description":"Tentou assaltar um mercador","deliberate":true,"witnessed":true,"known":true,"factionChanges":{"População de ValeDouro":-8,"Guarda de ValeDouro":-5},"legal":{"jurisdiction":"ValeDouro","status":"Suspeito","crimeKnown":true,"identified":true,"severity":1},"journal":{"title":"Aquilo que não era meu","body":"Hoje tentei tomar para mim aquilo que pertencia a outro. Fui visto, e agora meu ato já não pertence apenas à minha consciência."}}]]',
  'Exemplo de agressão armada testemunhada contra guarda: [[REPUTATION:{"type":"assault","description":"Atacou deliberadamente um agente da ordem com uma espada","deliberate":true,"witnessed":true,"known":true,"factionChanges":{"Guarda de ValeDouro":-20,"População de ValeDouro":-10},"legal":{"jurisdiction":"ValeDouro","status":"Ordem de prisão","crimeKnown":true,"identified":true,"severity":3},"journal":{"title":"Sangue pela minha mão","body":"Hoje saquei minha espada contra um homem que cumpria seu dever. Feriu-se pela minha mão. Para justificar o que fiz, tentei vestir meu ato com uma mentira."}}]]',
  'Se o personagem apenas falhar em um teste sem ter tomado uma decisão social/legal relevante, NÃO gere marcador.',
  'Se uma decisão privada foi tomada e ninguém sabe dela, ela pode ir ao Diário, mas não deve alterar reputação pública nem tornar o personagem procurado sem cadeia plausível de descoberta.',
  'Autoridades devem reagir proporcionalmente a fatos estabelecidos: agressão armada testemunhada exige ordem para largar a arma, contenção e tentativa de prisão; resistência pode escalar. Não invente reforços, cargos ou efetivos canônicos sem necessidade/estado fornecido.'
].join(' ');

function activeCharacter(){return window.state?.characters?.[window.state?.active||0]||null}
function isAI(url){try{return typeof AI_ENDPOINT!=='undefined'&&url===AI_ENDPOINT}catch{return false}}
function journalFallback(d){
  if(d.journal) return d.journal;
  const t=String(d.type||'').toLowerCase();
  if(t==='assault') return {title:'Sangue pela minha mão',body:'Hoje ergui minha arma contra outra pessoa. A decisão foi minha, e o que aconteceu depois nasceu dela.'};
  if(t==='threat') return {title:'Uma ameaça',body:'Hoje escolhi usar o medo como instrumento. Mesmo sem sangue, minhas palavras mudaram a forma como outros me verão.'};
  if(t==='deception') return {title:'Uma mentira',body:'Hoje escolhi esconder a verdade atrás de uma mentira. Talvez ela tenha convencido alguém; isso não muda o que eu sei que fiz.'};
  if(t==='vandalism') return {title:'O que deixei para trás',body:'Hoje destruí aquilo que não me pertencia. As marcas do meu ato permanecerão depois que eu seguir caminho.'};
  if(t==='betrayal') return {title:'Uma confiança quebrada',body:'Hoje rompi uma confiança que me havia sido oferecida. Algumas escolhas não podem ser recolhidas depois de feitas.'};
  return null;
}
function normalizeDecision(d){
  if(!d||typeof d!=='object') return null;
  const out={...d};
  if(out.deliberate===undefined) out.deliberate=true;
  if(!out.journal){const j=journalFallback(out);if(j)out.journal=j;}
  return out;
}
function parsePayload(payload){
  const raw=String(payload||'').trim();
  try{return normalizeDecision(JSON.parse(raw))}catch{}
  try{return normalizeDecision(JSON.parse(decodeURIComponent(raw)))}catch{}
  return null;
}
function processText(text){
  if(typeof text!=='string'||!text.includes('[[REPUTATION:')) return {text,changed:false};
  let changed=false;
  const cleaned=text.replace(/\s*\[\[REPUTATION:([\s\S]*?)\]\]\s*/gi,(_,payload)=>{
    try{
      const d=parsePayload(payload),c=activeCharacter();
      if(d&&c&&window.ValeReputation?.recordDecision){
        const r=window.ValeReputation.recordDecision(c,d);
        if(r?.ok) changed=true;
      }
    }catch(e){console.warn('Ponte de reputação: marcador inválido',e)}
    return ' ';
  });
  return {text:cleaned.trim(),changed};
}
function jsonResponseFrom(res,data){const headers=new Headers(res.headers);headers.set('Content-Type','application/json; charset=utf-8');return new Response(JSON.stringify(data),{status:res.status,statusText:res.statusText,headers})}

function install(){
  if(window.__VALE_REPUTATION_BRIDGE_FETCH__) return;
  if(!window.ValeReputation||!window.ValeJournal) return;
  window.__VALE_REPUTATION_BRIDGE_FETCH__=true;
  const previousFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    let patched=init;
    if(isAI(url)&&init?.method==='POST'&&init.body){
      try{
        const b=JSON.parse(init.body);
        b.world={...(b.world||{}),reputation_consequence_contract:CONTRACT};
        b.action=CONTRACT+' '+String(b.action||'');
        patched={...init,body:JSON.stringify(b)};
      }catch(e){console.warn('Ponte de reputação: contrato não injetado',e)}
    }
    const res=await previousFetch(input,patched);
    if(!isAI(url)||!res.ok) return res;
    try{
      const data=await res.clone().json();
      let touched=false;
      for(const field of ['reply','text']){
        if(typeof data?.[field]==='string'&&data[field].includes('[[REPUTATION:')){
          const p=processText(data[field]);
          data[field]=p.text;
          touched=touched||p.changed||true;
        }
      }
      if(touched) return jsonResponseFrom(res,data);
    }catch(e){console.warn('Ponte de reputação: resposta não processada',e)}
    return res;
  };
}

install();
let tries=0;
const timer=setInterval(()=>{install();if(window.__VALE_REPUTATION_BRIDGE_FETCH__||++tries>40)clearInterval(timer)},250);
})();

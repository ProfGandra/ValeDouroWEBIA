(()=>{
'use strict';
function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim()}
function denied(t){t=norm(t);return /nao conseguem|nao consegue|nao podem|nao pode|passagem bloqueada|nao e possivel|continuam na estrada|permanece na estrada/.test(t)}
function infer(t){t=norm(t);if(!t)return null;
  if(/depressao rochosa|local da queda|encontr\w* o aprendiz|aprendiz.{0,30}caido/.test(t))return 'LOC-007';
  if(/adentr\w*.{0,40}floresta|entr\w*.{0,30}(?:na|pela|em) floresta|seguir\w*.{0,35}(?:para|pela|na) floresta|ir.{0,20}(?:para|ate) a floresta|densa floresta|interior da floresta|dentro da floresta|na floresta|pela mata|entr\w*.{0,30}(?:na|pela) mata/.test(t))return 'LOC-006';
  if(/trilha.{0,35}bandid|rastros? dos bandid|rota.{0,25}bandid/.test(t))return 'LOC-005';
  if(/local da caravana|caravana (?:parada|encontrada|imobilizada)|sobreviventes.{0,60}caravana/.test(t))return 'LOC-004';
  if(/trecho acidentado|estrada (?:fica|torna-se|esta) irregular|sulcos profundos/.test(t))return 'LOC-003';
  if(/ultimo ponto confirmado|ultimo local confirmado|seguem pela estrada|continuam pela estrada/.test(t))return 'LOC-002';
  if(/saida de valedouro|portao de valedouro|deixam valedouro|partem de valedouro/.test(t))return 'LOC-001';
  return null;
}
const prev=window.fetch.bind(window);
window.fetch=async function(input,init){
  const url=typeof input==='string'?input:(input?.url||''),ai=(typeof AI_ENDPOINT!=='undefined'?AI_ENDPOINT:null);let action='';
  if(url===ai&&init?.method==='POST'&&init.body){try{action=JSON.parse(init.body)?.action||''}catch{}}
  const res=await prev(input,init);if(url!==ai)return res;
  try{const d=await res.clone().json(),reply=String(d?.reply||d?.text||'');if(!denied(reply)){const loc=infer(reply)||infer(action+' '+reply);if(loc)window.ValeSceneVisuals?.setScene?.(loc)}}catch(e){console.warn('Fallback visual de cena falhou',e)}
  return res;
};
})();

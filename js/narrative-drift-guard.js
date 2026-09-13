// ValeDouro WEBIA — guarda contra deriva narrativa / devaneios do Mestre
(function(){
'use strict';
if(window.__VALE_NARRATIVE_DRIFT_GUARD__)return;
window.__VALE_NARRATIVE_DRIFT_GUARD__=true;
const previousFetch=window.fetch.bind(window);
function isAI(url){try{return typeof AI_ENDPOINT!=='undefined'&&String(url).replace(/\/$/,'')===String(AI_ENDPOINT).replace(/\/$/,'')}catch{return false}}
function recentFacts(history){
 const h=Array.isArray(history)?history.slice(-10):[];
 return h.map(x=>({role:x.role||x.type||'',content:String(x.content||x.text||x.message||'').slice(0,1800)}));
}
function directive(){return [
 'GUARDA DE CONTINUIDADE E ANTIDERIVA — PRIORIDADE MÁXIMA.',
 'A Quest ativa, o estado persistido e os fatos já estabelecidos na conversa são a única autoridade factual. Descrição pode ser improvisada; fatos estruturais não.',
 'NÃO invente nomes próprios de cidades, vilas, tavernas, NPCs, guildas, ruínas, florestas, estradas, facções, carregamentos, desaparecimentos, rumores, pistas, antagonistas ou objetivos se eles não estiverem na Quest/estado/histórico confirmado.',
 'Quando precisar de figurante não canônico, use função genérica sem nome: um aldeão, um mercador, um lenhador, um guarda, um cocheiro. Não transforme figurante em personagem recorrente sem necessidade.',
 'Preserve identidade e função de NPCs. Um taberneiro não muda de nome; um aprendiz de ferreiro não vira guia; um cocheiro não ganha nova missão ou novo passado espontaneamente.',
 'Preserve local, período do dia, clima e objetivo imediato. Não avance manhã para tarde/noite sem deslocamento ou ação que justifique passagem de tempo.',
 'Não transforme uma pergunta ou interação lateral em nova missão. Serviços, bebida, comércio, conversa e ajuda casual devem terminar e devolver o foco à situação vigente.',
 'PROGRESSÃO COM PROPÓSITO: se o jogador segue uma pista válida da Quest, aproxime-o do próximo fato/nó permitido pela Quest. Não crie uma cadeia de trilha > bifurcação > pista > nova bifurcação apenas para prolongar a viagem.',
 'Não crie bifurcações, rastros, ruínas, sons misteriosos, objetos-pista ou rumores apenas para oferecer escolha. Uma escolha espacial só existe se decorrer do mapa/Quest/fato estabelecido ou da ação do jogador.',
 'Falha em teste NÃO autoriza criar uma nova subtrama. A falha deve produzir custo local plausível: tempo, posição pior, informação incompleta, ruído, recurso gasto ou consequência diretamente ligada à tentativa.',
 'Nunca trate detalhe inventado numa resposta anterior como cânone se ele contradiz Quest/estado. Em conflito, descarte silenciosamente o detalhe inventado e retorne ao estado autoritativo.',
 'Não presuma equipamentos, companheiros ou recursos além dos fornecidos pelo estado.',
 'Antes de responder, verifique mentalmente: QUEM está aqui? ONDE? QUANDO? QUAL objetivo atual? O que mudou pela última ação? Responda somente a partir disso.',
 'Termine com uma situação acionável coerente, sem fabricar um novo gancho quando o atual ainda não foi resolvido.'
 ].join(' ')}
window.fetch=async function(input,init){
 const url=typeof input==='string'?input:(input?.url||'');
 if(!isAI(url)||!init||String(init.method||'GET').toUpperCase()!=='POST'||!init.body)return previousFetch(input,init);
 let patched=init;
 try{
  const body=JSON.parse(init.body);
  body.world={...(body.world||{}),narrative_drift_policy:directive(),factual_authority_order:['active_quest','persisted_state','confirmed_history','player_action','free_description'],anti_filler_progression:true};
  body.continuity_guard={recent_confirmed_context:recentFacts(body.history),rules:'Preserve identities, location, time, active objective and negotiated terms. New proper nouns and new quest branches require authoritative support.'};
  body.action=directive()+' AÇÃO ATUAL DO JOGADOR: '+String(body.action||'');
  patched={...init,body:JSON.stringify(body)};
 }catch(e){console.warn('Guarda antideriva não aplicada',e)}
 return previousFetch(input,patched);
};
})();

const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST,OPTIONS"};
export async function onRequestOptions(){ return new Response(null,{headers:cors}); }
export async function onRequestPost(context){
  try{
    const { env, request } = context;
    if(!env.GROQ_API_KEY) return json({error:"GROQ_API_KEY não configurada no ambiente do Cloudflare Pages."},500);
    const body = await request.json();
    const model = env.GROQ_MODEL || "llama-3.3-70b-versatile";
    const system = `Você é o Mestre Virtual oficial do RPG ValeDouro. Narre em português brasileiro, em segunda pessoa, com atmosfera medieval-fantástica. Nunca revele IDs de quest, estruturas internas, master truth, gatilhos ou segredos do DM. As quests existem apenas nos bastidores e devem emergir organicamente por acontecimentos, NPCs, rumores e consequências. Respeite rigorosamente a ficha, inventário, atributos e estado enviados. Não invente que o personagem possui um item que não está no inventário. Não role dados por conta própria: quando uma ação exigir teste, termine sua resposta com uma linha exata no formato [[ROLL:ATRIBUTO:CD:motivo]], usando FOR, DES, CON, INT, SAB ou CAR. Se nenhuma rolagem for necessária, não inclua marcador. Seja responsivo às escolhas do jogador; não force uma rota única. Mantenha respostas entre 2 e 5 parágrafos, salvo necessidade especial.`;
    const state = JSON.stringify(body.state || {});
    const hiddenQuest = JSON.stringify(body.hiddenQuest || {});
    const history = (body.history || []).slice(-14).map(x=>({role:x.role,content:x.content}));
    const messages = [{role:"system",content:system+"\nESTADO DO JOGO:\n"+state+"\nCONTEXTO OCULTO DA AVENTURA:\n"+hiddenQuest}, ...history, {role:"user",content:body.action || "Inicie a aventura de forma orgânica, sem mencionar quest."}];
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Authorization":`Bearer ${env.GROQ_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model,messages,temperature:.8,max_tokens:700})});
    const data = await r.json();
    if(!r.ok) return json({error:data?.error?.message || "Falha no provedor de IA",providerStatus:r.status},502);
    return json({text:data.choices?.[0]?.message?.content || "",model});
  }catch(e){return json({error:String(e?.message||e)},500)}
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8"}})}

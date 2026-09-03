(function(){
const KEY='valedouro.inventory.v1';
const COINS={copper:'Cobre',silver:'Prata',gold:'Ouro'};
const travelerKit=[
 {id:'backpack',name:'Mochila',qty:1,unit:'un',category:'Permanente'},
 {id:'canteen',name:'Cantil',qty:1,unit:'un',category:'Permanente',fillable:'water'},
 {id:'blanket',name:'Manta de viagem',qty:1,unit:'un',category:'Permanente'},
 {id:'cloak',name:'Capa de viagem',qty:1,unit:'un',category:'Permanente'},
 {id:'flint-steel',name:'Pederneira e aço',qty:1,unit:'conj.',category:'Desgastável'},
 {id:'torch',name:'Tocha',qty:3,unit:'un',category:'Consumível'},
 {id:'rope',name:'Corda comum',qty:10,unit:'m',category:'Fracionável'},
 {id:'rations',name:'Rações de viagem',qty:3,unit:'dias',category:'Consumível'},
 {id:'cookware',name:'Panela/caneca metálica',qty:1,unit:'un',category:'Permanente'},
 {id:'cutlery',name:'Talheres simples',qty:1,unit:'conj.',category:'Permanente'},
 {id:'cloth',name:'Pano de tecido',qty:2,unit:'un',category:'Consumível'},
 {id:'soap',name:'Sabão pequeno',qty:1,unit:'un',category:'Consumível'},
 {id:'waterskin',name:'Recipiente auxiliar',qty:1,unit:'un',category:'Permanente',fillable:'water'},
 {id:'small-bag',name:'Pequeno saco',qty:2,unit:'un',category:'Permanente'},
 {id:'candle',name:'Vela',qty:2,unit:'un',category:'Consumível'},
 {id:'chalk',name:'Giz',qty:3,unit:'un',category:'Consumível'},
 {id:'utility-knife',name:'Faca utilitária',qty:1,unit:'un',category:'Permanente',tool:true}
];
const basePrices={torch:{copper:2},rope:{copper:2,per:'m'},rations:{copper:8,per:'dia'},cloth:{copper:3},soap:{copper:4},candle:{copper:1},chalk:{copper:1},canteen:{silver:2},blanket:{silver:3},cloak:{silver:5},backpack:{silver:4},'utility-knife':{silver:2}};
function clone(x){return JSON.parse(JSON.stringify(x))}
function key(c){return `${c.name}|${c.cls||''}`}
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function saveAll(x){localStorage.setItem(KEY,JSON.stringify(x))}
function ensure(c){const db=load(),k=key(c);if(!db[k])db[k]={coins:{gold:0,silver:10,copper:0},items:clone(travelerKit),resources:[],updatedAt:new Date().toISOString()};saveAll(db);c.inventory=db[k];return db[k]}
function persist(c){const db=load(),k=key(c);db[k]=c.inventory||ensure(c);db[k].updatedAt=new Date().toISOString();saveAll(db);if(typeof window.saveChars==='function')window.saveChars()}
function find(inv,id){return [...(inv.items||[]),...(inv.resources||[])].find(x=>x.id===id)}
function add(c,item){const inv=ensure(c),list=item.resource?inv.resources:inv.items,found=list.find(x=>x.id===item.id);if(found)found.qty=Number(found.qty||0)+Number(item.qty||1);else list.push({...item,qty:Number(item.qty||1)});persist(c);return true}
function consume(c,id,qty=1){const inv=ensure(c),it=find(inv,id);if(!it||Number(it.qty)<qty)return false;it.qty=Math.max(0,Number(it.qty)-qty);persist(c);return true}
function setQty(c,id,qty){const inv=ensure(c),it=find(inv,id);if(!it)return false;it.qty=Math.max(0,Number(qty)||0);persist(c);return true}
function walletCopper(coins){return (coins.gold||0)*100+(coins.silver||0)*10+(coins.copper||0)}
function normalizeCoins(total){total=Math.max(0,Math.floor(total));return {gold:Math.floor(total/100),silver:Math.floor(total%100/10),copper:total%10}}
function pay(c,copper){const inv=ensure(c),total=walletCopper(inv.coins);if(total<copper)return false;inv.coins=normalizeCoins(total-copper);persist(c);return true}
function credit(c,copper){const inv=ensure(c);inv.coins=normalizeCoins(walletCopper(inv.coins)+Math.max(0,copper));persist(c)}
function kitDeficit(c){const inv=ensure(c);return travelerKit.map(std=>{const cur=find(inv,std.id)?.qty||0;return {...std,current:cur,missing:Math.max(0,std.qty-cur)}}).filter(x=>x.missing>0)}
function marketQuote(c,availability=null,multiplier=1){return kitDeficit(c).filter(x=>!availability||availability.includes(x.id)).map(x=>{const p=basePrices[x.id];if(!p)return {...x,priceCopper:null};return {...x,priceCopper:Math.ceil(((p.copper||0)+(p.silver||0)*10+(p.gold||0)*100)*x.missing*multiplier)}})}
function replenish(c,ids,availability=null,multiplier=1){const quote=marketQuote(c,availability,multiplier).filter(x=>!ids||ids.includes(x.id));const priced=quote.filter(x=>x.priceCopper!=null),cost=priced.reduce((a,x)=>a+x.priceCopper,0);if(!pay(c,cost))return {ok:false,reason:'funds',cost};priced.forEach(x=>setQty(c,x.id,x.qty));return {ok:true,cost,items:priced}}
function gather(c,resource){return add(c,{id:resource.id||('resource-'+Date.now()),name:resource.name,qty:resource.qty||1,unit:resource.unit||'un',category:'Recurso natural',resource:true,source:resource.source||'nature'})}
function moneyText(coins){return `${coins.gold||0} ouro • ${coins.silver||0} prata • ${coins.copper||0} cobre`}
function open(i){const c=window.state?.characters?.[i??window.state.active];if(!c)return;const inv=ensure(c),rows=[...(inv.items||[]),...(inv.resources||[])].map(x=>`<tr><td>${window.esc?esc(x.name):x.name}</td><td>${x.qty} ${x.unit||''}</td><td>${x.category||'Item'}</td></tr>`).join('');document.getElementById('inventoryContent').innerHTML=`<h2>Inventário — ${window.esc?esc(c.name):c.name}</h2><p><strong>Bolsa:</strong> ${moneyText(inv.coins)}</p><table class="inventory-table"><thead><tr><th>Item</th><th>Quantidade</th><th>Tipo</th></tr></thead><tbody>${rows||'<tr><td colspan="3">Inventário vazio.</td></tr>'}</tbody></table><p class="muted">O Kit de Viajante é composto por itens reais e consumíveis. Recursos coletados na natureza entram individualmente no inventário.</p>`;document.getElementById('inventoryModal').classList.add('active')}
function close(){document.getElementById('inventoryModal')?.classList.remove('active')}
window.ValeInventory={travelerKit,basePrices,ensure,persist,add,consume,setQty,pay,credit,kitDeficit,marketQuote,replenish,gather,moneyText,open,close};
window.openInventory=open;window.closeInventory=close;
})();
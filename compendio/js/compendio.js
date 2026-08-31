
const cards=[...document.querySelectorAll('.npc-card')];
const search=document.getElementById('search'), group=document.getElementById('group'), status=document.getElementById('status');
function filter(){
  const q=search.value.trim().toLowerCase(), g=group.value, s=status.value;
  cards.forEach(c=>{
    const text=c.innerText.toLowerCase();
    const show=(!q||text.includes(q))&&(!g||(c.dataset.category||'').split('|').includes(g))&&(!s||c.dataset.status===s);
    c.classList.toggle('hidden',!show);
  });
}
search.addEventListener('input',filter); group.addEventListener('change',filter); status.addEventListener('change',filter);
function openArt(i){document.getElementById('modal-'+i)?.classList.add('open')}
function closeArt(i,e){if(e)e.stopPropagation();document.getElementById('modal-'+i)?.classList.remove('open')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal.open').forEach(m=>m.classList.remove('open'))})



function openInlineArt(btn){
 const img = btn.querySelector("img");
 const modal = document.getElementById("artModal");
 if(!img || !modal) return;
 const modalImg = modal.querySelector("img");
 if(modalImg){
   modalImg.src = img.src;
   modalImg.alt = img.alt || "Ficha/arte ampliada";
 }
 modal.classList.add("open");
}

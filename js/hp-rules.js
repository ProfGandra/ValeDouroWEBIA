// ValeDouro WEBIA — regras consolidadas de PV e Dados de Vida
(function(){
  function hitDieFor(className){
    return hitDie[className]||8;
  }

  function calculateMulticlassHP(classes,conMod){
    let hp=0;
    let firstCharacterLevel=true;

    (classes||[]).forEach(cls=>{
      const die=hitDieFor(cls.name);
      const levels=Math.max(0,Number(cls.level)||0);

      for(let level=0;level<levels;level++){
        // O primeiro nível total do personagem recebe o valor máximo do Dado de Vida.
        // Todos os níveis seguintes usam o valor médio arredondado para cima.
        const base=firstCharacterLevel?die:(Math.floor(die/2)+1);
        hp+=Math.max(1,base+conMod);
        firstCharacterLevel=false;
      }
    });

    return Math.max(1,hp);
  }

  function summarizeHitDice(classes){
    const grouped=new Map();
    (classes||[]).forEach(cls=>{
      const die=hitDieFor(cls.name);
      const levels=Math.max(0,Number(cls.level)||0);
      grouped.set(die,(grouped.get(die)||0)+levels);
    });

    return [...grouped.entries()]
      .sort((a,b)=>b[0]-a[0])
      .map(([die,count])=>`${count}d${die}`)
      .join(' + ');
  }

  // Substitui apenas o cálculo-base do personagem. O restante do fluxo permanece igual.
  window.calc=function(c){
    const level=(c.classes||[]).reduce((sum,cls)=>sum+(Number(cls.level)||0),0);
    const dex=mod(c.attrs.DES);
    const con=mod(c.attrs.CON);

    c.level=level;
    c.prof=prof(level);
    c.ini=dex;
    c.ca=armorCA(c.armor,dex,c.shield);
    c.hpMax=calculateMulticlassHP(c.classes,con);
    c.hp=c.hpMax;
    c.speed=9;
    c.hitDice=summarizeHitDice(c.classes);
    c.cls=c.classes.map(x=>`${x.name} ${x.level}`).join(' / ');
    return c;
  };

  // Utilitário para futuras migrações sem curar automaticamente personagens feridos.
  window.recalculateCharacterVitals=function(c){
    if(!c||!Array.isArray(c.classes)||!c.attrs)return c;
    const oldMax=Number(c.hpMax||0);
    const oldHp=Number(c.hp||0);
    const con=mod(c.attrs.CON);
    const newMax=calculateMulticlassHP(c.classes,con);
    const damage=Math.max(0,oldMax-oldHp);
    c.hpMax=newMax;
    c.hp=Math.max(0,newMax-damage);
    c.hitDice=summarizeHitDice(c.classes);
    return c;
  };
})();

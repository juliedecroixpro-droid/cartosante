(function(){
  var LABELS = {1:"Tres sous-dotee",2:"Sous-dotee",3:"Intermediaire",4:"Tres dotee",5:"Sur-dotee",0:"Non disponible"};
  var COLORS = {1:"#991B1B",2:"#F97316",3:"#FACC15",4:"#4ADE80",5:"#166534",0:"#9CA3AF"};
  var TEXT_ON = {1:"#fff",2:"#fff",3:"#111",4:"#111",5:"#fff",0:"#fff"};
  var DESC = {
    1:"Votre commune est classee en zone tres sous-dotee. C'est une zone prioritaire ou l'offre de soins infirmiers est tres insuffisante. Des aides significatives sont disponibles pour encourager l'installation.",
    2:"Votre commune est classee en zone sous-dotee. L'offre de soins infirmiers y est insuffisante. Des aides a l'installation sont disponibles.",
    3:"Votre commune est classee en zone intermediaire. L'offre de soins infirmiers y est equilibree. Installation libre, sans aide ni restriction.",
    4:"Votre commune est classee en zone tres dotee. L'offre est superieure a la moyenne. Installation libre, sans incitation.",
    5:"Votre commune est classee en zone sur-dotee. L'offre est excedentaire. Conventionnement conditionne au depart d'un confrere (regle \"1 pour 1\").",
    0:"Donnees non disponibles pour cette commune."
  };
  var AIDES = {
    1:["Contrat incitatif ARS","Aide a l'installation (jusqu'a 37 500 EUR)","Exoneration ZRR","Accompagnement CPAM"],
    2:["Contrat d'aide a l'installation","Accompagnement CPAM"],
    3:["Pas d'aide specifique, installation libre"],
    4:["Installation libre, pas d'incitations"],
    5:["Conventionnement conditionne (regle \"1 pour 1\")"],
    0:[]
  };
  var SHORT_DESC = {
    1:"Zone prioritaire. Aides significatives a l'installation.",
    2:"Zone fragile. Aides a l'installation disponibles.",
    3:"Offre equilibree. Installation libre.",
    4:"Offre superieure a la moyenne. Installation libre.",
    5:"Offre excedentaire. Regle \"1 pour 1\"."
  };
  var INSTALL = {1:"Libre + aides",2:"Libre + aides",3:"Libre",4:"Libre",5:"Conditionnee"};
  var AIDE_SHORT = {1:"Contrat ARS, aide installation, ZRR",2:"Contrat installation, CPAM",3:"Aucune",4:"Aucune",5:"Aucune"};

  var communes = [], hi = -1, suggs = [];

  function norm(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}

  function search(q){
    if(!q||q.length<2) return [];
    var n=norm(q), sw=[], cw=[];
    for(var i=0;i<communes.length;i++){
      var c=communes[i];
      if(sw.length+cw.length>=8) break;
      var nn=norm(c.nom);
      if(nn.startsWith(n)) sw.push(c);
      else if(nn.includes(n)||c.code.startsWith(n)) cw.push(c);
    }
    return sw.concat(cw).slice(0,8);
  }

  function showResult(c){
    var col=COLORS[c.zone], txt=TEXT_ON[c.zone];
    var aidesHtml = AIDES[c.zone].map(function(a){
      return '<li style="display:flex;align-items:start;gap:8px;"><span style="color:#1E40AF;flex-shrink:0;margin-top:2px;">&#10003;</span><span style="color:#374151;">'+a+'</span></li>';
    }).join("");
    var el=document.getElementById("zn-result");
    el.style.display="block";
    el.innerHTML =
      '<div style="background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.08);border:1px solid #F3F4F6;overflow:hidden;margin-bottom:24px;">'+
        '<div style="padding:24px 28px;">'+
          '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:16px;">'+
            '<div style="flex:1;min-width:200px;"><h2 style="font-size:22px;font-weight:700;color:#111;margin:0;">'+c.nom+'</h2><p style="color:#6B7280;margin:4px 0 0;">Code INSEE : '+c.code+'</p></div>'+
            '<span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;background:'+col+';color:'+txt+';">'+LABELS[c.zone]+'</span>'+
          '</div>'+
          '<p style="color:#374151;line-height:1.6;margin:0 0 20px;">'+DESC[c.zone]+'</p>'+
          (aidesHtml?'<div style="background:#F9FAFB;border-radius:12px;padding:16px 20px;"><h3 style="font-weight:600;color:#111;margin:0 0 10px;">'+(c.zone<=2?"Aides disponibles":"Conditions d\'installation")+'</h3><ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">'+aidesHtml+'</ul></div>':'')+
        '</div>'+
      '</div>';
    el.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function buildZones(stats){
    var html="";
    for(var z=1;z<=5;z++){
      html+='<div style="display:flex;align-items:start;gap:14px;padding:14px;border-radius:12px;border:1px solid #F3F4F6;margin-bottom:8px;">'+
        '<span style="width:12px;height:12px;border-radius:50%;background:'+COLORS[z]+';flex-shrink:0;margin-top:5px;display:inline-block;"></span>'+
        '<div style="flex:1;"><div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;">'+
          '<strong style="color:#111;">'+LABELS[z]+'</strong>'+
          (stats?'<span style="font-size:13px;color:#9CA3AF;">'+stats[z].toLocaleString("fr-FR")+' communes</span>':'')+
        '</div><p style="color:#6B7280;font-size:14px;margin:4px 0 0;">'+SHORT_DESC[z]+'</p></div></div>';
    }
    document.getElementById("zn-zones").innerHTML=html;

    var thtml='<table style="width:100%;font-size:14px;border-collapse:collapse;">'+
      '<thead><tr style="border-bottom:2px solid #E5E7EB;">'+
      '<th style="text-align:left;padding:10px 12px;font-weight:600;color:#111;">Zone</th>'+
      '<th style="text-align:left;padding:10px 12px;font-weight:600;color:#111;">Installation</th>'+
      '<th style="text-align:left;padding:10px 12px;font-weight:600;color:#111;">Aides</th>'+
      (stats?'<th style="text-align:right;padding:10px 12px;font-weight:600;color:#111;">Communes</th>':'')+
      '</tr></thead><tbody>';
    for(var z2=1;z2<=5;z2++){
      thtml+='<tr style="border-bottom:1px solid #F3F4F6;">'+
        '<td style="padding:10px 12px;"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:'+COLORS[z2]+';display:inline-block;"></span><span style="font-weight:500;color:#111;">'+LABELS[z2]+'</span></span></td>'+
        '<td style="padding:10px 12px;color:#6B7280;">'+INSTALL[z2]+'</td>'+
        '<td style="padding:10px 12px;color:#6B7280;">'+AIDE_SHORT[z2]+'</td>'+
        (stats?'<td style="padding:10px 12px;text-align:right;color:#6B7280;">'+stats[z2].toLocaleString("fr-FR")+'</td>':'')+
        '</tr>';
    }
    thtml+='</tbody></table>';
    document.getElementById("zn-table").innerHTML=thtml;

    if(stats){
      var shtml='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;">';
      for(var z3=1;z3<=5;z3++){
        shtml+='<div style="text-align:center;padding:16px 8px;border-radius:12px;background:#F9FAFB;border:1px solid #F3F4F6;">'+
          '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:'+COLORS[z3]+';margin-bottom:6px;"></span>'+
          '<div style="font-size:20px;font-weight:700;color:#111;">'+stats[z3].toLocaleString("fr-FR")+'</div>'+
          '<div style="font-size:11px;color:#6B7280;margin-top:3px;">'+LABELS[z3]+'</div></div>';
      }
      shtml+='</div>';
      document.getElementById("zn-stats").innerHTML=shtml;
    }
  }

  // Force z-index and overflow on parent containers
  var fixParents = document.getElementById("zn-suggestions");
  if(fixParents){
    var p = fixParents.parentElement;
    while(p && p !== document.body){
      p.style.overflow = "visible";
      p.style.position = p.style.position || "relative";
      p = p.parentElement;
    }
  }

  // Load data from Vercel
  fetch("https://cartosante-sigma.vercel.app/data/zonage.json")
    .then(function(r){return r.json();})
    .then(function(data){
      communes=data;
      document.getElementById("zn-search").placeholder="Rechercher une commune (nom ou code INSEE)...";
      var stats={0:0,1:0,2:0,3:0,4:0,5:0};
      data.forEach(function(c){stats[c.zone]=(stats[c.zone]||0)+1;});
      buildZones(stats);
    });

  // Search logic
  var timer;
  var input=document.getElementById("zn-search");
  var sugBox=document.getElementById("zn-suggestions");

  input.addEventListener("input",function(){
    clearTimeout(timer);
    hi=-1;
    timer=setTimeout(function(){
      suggs=search(input.value);
      if(suggs.length){
        sugBox.style.display="block";
        sugBox.innerHTML=suggs.map(function(c,i){
          return '<div class="zn-sug" data-i="'+i+'" style="padding:10px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">'+
            '<span style="color:#111;font-weight:500;">'+c.nom+'</span>'+
            '<span style="color:#9CA3AF;font-size:13px;">'+c.code+'</span></div>';
        }).join("");
      } else sugBox.style.display="none";
    },200);
  });

  input.addEventListener("keydown",function(e){
    if(sugBox.style.display==="none") return;
    if(e.key==="ArrowDown"){e.preventDefault();hi=Math.min(hi+1,suggs.length-1);updateHi();}
    else if(e.key==="ArrowUp"){e.preventDefault();hi=Math.max(hi-1,0);updateHi();}
    else if(e.key==="Enter"&&hi>=0){e.preventDefault();pick(suggs[hi]);}
    else if(e.key==="Escape") sugBox.style.display="none";
  });

  function updateHi(){
    var els=sugBox.querySelectorAll(".zn-sug");
    for(var i=0;i<els.length;i++) els[i].style.background=i===hi?"#EFF6FF":"";
  }

  function pick(c){
    input.value=c.nom+" ("+c.code+")";
    sugBox.style.display="none";
    suggs=[];hi=-1;
    showResult(c);
  }

  sugBox.addEventListener("click",function(e){
    var el=e.target.closest(".zn-sug");
    if(el) pick(suggs[+el.dataset.i]);
  });

  document.addEventListener("mousedown",function(e){
    if(!sugBox.contains(e.target)&&e.target!==input) sugBox.style.display="none";
  });
})();

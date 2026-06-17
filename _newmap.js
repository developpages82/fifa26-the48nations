const svg=d3.select('#map').attr('viewBox',`0 0 ${W} ${H}`);
const gWater=svg.append('g');
const gGrat=svg.append('g');
const gCountry=svg.append('g');
const gMk=svg.append('g');
const gLab=svg.append('g');
const projection=d3.geoOrthographic().clipAngle(90).precision(0.4);
const path=d3.geoPath(projection);
const tooltip=document.getElementById('tooltip');
let showLabels=true;
let confFilter=null;
const LABEL_PX=12;
let scaleK=1, baseScale=300, rotate=[83,-12,0];

function fit(){ baseScale=Math.min(W,H)/2-26; projection.translate([W/2,H/2]).scale(baseScale*scaleK).rotate(rotate); }
function redraw(){
  gWater.select('path').attr('d',path);
  gGrat.select('path').attr('d',path);
  gCountry.selectAll('path').attr('d',path);
  drawLabels();
}

(function(world){ try{
  let feats=topojson.feature(world,world.objects.countries).features
    .filter(f=>f.properties.name!=='Antarctica');
  feats.forEach(f=>{f._team=T.find(t=>d3.geoContains(f,[t.longitude,t.latitude]))||null; if(f._team)f._team._feat=f;});
  T.forEach(t=>{ if(!feats.some(f=>f._team===t)){ const f=feats.find(f=>!f._team && (f.properties.name===t.name_en)); if(f){f._team=t;t._feat=f;} } });

  fit();
  gWater.append('path').datum({type:'Sphere'}).attr('class','globe-water');
  gGrat.append('path').datum(d3.geoGraticule10()).attr('class','graticule');
  gCountry.selectAll('path').data(feats).join('path')
    .attr('class',d=>'country'+(d._team?' host':''))
    .style('cursor',d=>d._team?'pointer':'grab')
    .on('mousemove',(e,d)=>{ if(d._team){const t=d._team;
        showTip(e,`<div class="tf"><img src="${flagURL(t,'w40')}" alt="">${t.name_ja}</div><small>${t.name_en.toUpperCase()} · #${t.fifa_rank}</small>`);}
      else {const nm=d.properties.name;const ja=(window.NAMES_JA&&window.NAMES_JA[nm])||nm;const ic=window.NAME2ISO&&window.NAME2ISO[nm];const fimg=ic&&window.FLAGS[ic]?`<img src="${window.FLAGS[ic]}" alt="">`:'';
        showTip(e,`<div class="tf tf-sub">${fimg}${ja}</div><small class="sub-en">${nm}</small>`,true);} })
    .on('mouseleave',hideTip)
    .on('click',(e,d)=>{ if(d._team){e.stopPropagation();flyTo(d._team);openCountry(d._team);} });

  initialView();
  redraw();
  window._mapReady=true;
}catch(err){console.error(err);var ss=document.getElementById('splashStatus');if(ss)ss.textContent='地図の描画に失敗しました: '+err.message;window._mapErr=true;} })(window.WORLD_TOPO);

function drawMarkers(){ drawLabels(); }
function isVisible(t){const c=[-rotate[0],-rotate[1]];return d3.geoDistance([t.longitude,t.latitude],c) < (Math.PI/2 - 0.04);}
function drawLabels(){
  if(!showLabels){gLab.selectAll('text').remove();return;}
  const placed=[], vis=[];
  const cand=T.slice().filter(t=>!confFilter||t.confederation===confFilter).sort((a,b)=>a.fifa_rank-b.fifa_rank);
  cand.forEach(t=>{
    if(!isVisible(t)) return;
    const p=projection([t.longitude,t.latitude]); if(!p) return;
    const sx=p[0], sy=p[1];
    if(sx<-40||sx>W+40||sy<-30||sy>H+30) return;
    const w=t.name_ja.length*LABEL_PX*0.64+8, hh=LABEL_PX+8;
    const box=[sx-w/2, sy-hh/2, sx+w/2, sy+hh/2];
    const hit=placed.some(b=>!(box[2]<b[0]||box[0]>b[2]||box[3]<b[1]||box[1]>b[3]));
    if(!hit){placed.push(box); vis.push(t);}
  });
  gLab.selectAll('text').data(vis,d=>d.id).join('text')
    .attr('class','mlabel')
    .attr('x',d=>{const p=projection([d.longitude,d.latitude]);return p?p[0]:-999;})
    .attr('y',d=>{const p=projection([d.longitude,d.latitude]);return p?p[1]:-999;})
    .attr('text-anchor','middle')
    .attr('dominant-baseline','central')
    .style('font-size',LABEL_PX+'px')
    .style('stroke-width',(LABEL_PX*0.24)+'px')
    .text(d=>d.name_ja)
    .on('mousemove',(e,d)=>showTip(e,`<div class="tf"><img src="${flagURL(d,'w40')}" alt="">${d.name_ja}</div><small>${d.name_en.toUpperCase()} · #${d.fifa_rank}</small>`))
    .on('mouseleave',hideTip)
    .on('click',(e,d)=>{e.stopPropagation();flyTo(d);openCountry(d);});
}
function showTip(e,html,subtle){tooltip.innerHTML=html;tooltip.style.display='block';
  tooltip.classList.toggle('subtle',!!subtle);
  tooltip.style.left=e.clientX+'px';tooltip.style.top=e.clientY+'px';}
function hideTip(){tooltip.style.display='none';}

/* ---------- GLOBE CONTROLS (rotate / zoom) ---------- */
const SCALE_MIN=0.85, SCALE_MAX=7;
let _p0=null, _r0=null;
const drag=d3.drag()
  .on('start',ev=>{_p0=[ev.x,ev.y];_r0=projection.rotate();})
  .on('drag',ev=>{ if(!_p0)return; const k=78/projection.scale();
    rotate=[_r0[0]+(ev.x-_p0[0])*k, Math.max(-90,Math.min(90,_r0[1]-(ev.y-_p0[1])*k)), 0];
    projection.rotate(rotate); redraw(); });
svg.call(drag).on('dblclick.zoom',null);
svg.node().addEventListener('wheel',ev=>{ev.preventDefault();
  scaleK=Math.max(SCALE_MIN,Math.min(SCALE_MAX, scaleK*(ev.deltaY<0?1.12:0.892)));
  projection.scale(baseScale*scaleK); redraw();},{passive:false});

function animateTo(targetRotate,targetK){
  const r0=projection.rotate(), k0=scaleK;
  const ri=d3.interpolate(r0,[targetRotate[0],targetRotate[1],0]);
  const ki=d3.interpolate(k0, targetK==null?k0:targetK);
  d3.transition().duration(820).tween('globe',()=>tt=>{
    rotate=ri(tt); scaleK=ki(tt);
    projection.rotate(rotate).scale(baseScale*scaleK); redraw();
  });
}
function zoomBy(f){scaleK=Math.max(SCALE_MIN,Math.min(SCALE_MAX,scaleK*f));animateTo(projection.rotate(),scaleK);}
document.getElementById('zin').onclick=()=>zoomBy(1.5);
document.getElementById('zout').onclick=()=>zoomBy(1/1.5);
function initialView(){ scaleK=1; rotate=[83,-12,0]; projection.rotate(rotate).scale(baseScale*scaleK); }
document.getElementById('zreset').onclick=()=>animateTo([83,-12,0],1);
function flyTo(t){ animateTo([-t.longitude,-t.latitude], Math.max(scaleK,1.9)); }

addEventListener('resize',()=>{W=innerWidth;H=innerHeight;svg.attr('viewBox',`0 0 ${W} ${H}`);fit();redraw();});


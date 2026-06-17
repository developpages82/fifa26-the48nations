/* ===== FIFA WC2026 — 2D Mercator World Map Explorer ===== */
const T = window.WC2026;
const CONF = {
  UEFA:{c:'#1d6cff',ja:'欧州'}, CONMEBOL:{c:'#e0a400',ja:'南米'},
  CAF:{c:'#1ca25a',ja:'アフリカ'}, AFC:{c:'#ff4d6d',ja:'アジア'},
  CONCACAF:{c:'#8b5cf6',ja:'北中米'}, OFC:{c:'#ff9f43',ja:'オセアニア'}
};
const fmt = n => (n==null?'—':n.toLocaleString());
/* flagcdn helper (Wikipedia「国旗の一覧」相当のSVG/PNG) */
function iso2cdn(t){let c=(t.iso2||'').toLowerCase();if(t.iso2==='EN')c='gb-eng';if(t.iso2==='SCO')c='gb-sct';return c;}
const flagURL=(t,w)=>`https://flagcdn.com/${w}/${iso2cdn(t)}.png`;
const flagColors=t=>[t.flag_color1_hex,t.flag_color2_hex,t.flag_color3_hex].filter(Boolean);
function flagBand(t){const c=flagColors(t);if(c.length<2)c.push('#ccc');
  return `linear-gradient(90deg,${c.map((x,i)=>`${x} ${i/(c.length-1)*100}%`).join(',')})`;}

/* ---------- MAP SETUP ---------- */
let W=innerWidth,H=innerHeight;
const svg=d3.select('#map').attr('viewBox',`0 0 ${W} ${H}`);
const gZoom=svg.append('g');
const gCountry=gZoom.append('g');
const gGrat=gZoom.append('g');
const gMk=gZoom.append('g');
const gLab=gZoom.append('g');
const projection=d3.geoMercator();
const path=d3.geoPath(projection);
const tooltip=document.getElementById('tooltip');
let colorMode='flag'; // flag | conf
let showLabels=true;
let curK=1;

function markerFill(t){return colorMode==='flag'?(t.flag_color1_hex||CONF[t.confederation].c):CONF[t.confederation].c;}

d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(world=>{
  let feats=topojson.feature(world,world.objects.countries).features
    .filter(f=>f.properties.name!=='Antarctica');
  const fc={type:'FeatureCollection',features:feats};
  projection.fitExtent([[10,70],[W-10,H-20]],fc);

  gCountry.selectAll('path').data(feats).join('path')
    .attr('class','country').attr('d',path)
    .on('mousemove',(e,d)=>showTip(e,`<div class="tf">${d.properties.name}</div>`))
    .on('mouseleave',hideTip);

  gGrat.append('path').datum(d3.geoGraticule10()).attr('class','graticule').attr('d',path);

  drawMarkers();
  const sp=document.getElementById('spin');sp.style.opacity=0;setTimeout(()=>sp.remove(),600);
}).catch(()=>{document.querySelector('#spin p').textContent='地図の読み込みに失敗しました（ネット接続をご確認ください）';});

function drawMarkers(){
  gMk.selectAll('circle').data(T,d=>d.id).join('circle')
    .attr('class','mk')
    .attr('cx',d=>projection([d.longitude,d.latitude])[0])
    .attr('cy',d=>projection([d.longitude,d.latitude])[1])
    .attr('r',d=>(4+(1-Math.min(d.fifa_rank,70)/70)*5)/curK)
    .attr('fill',d=>markerFill(d))
    .on('mousemove',(e,d)=>showTip(e,
      `<div class="tf"><img src="${flagURL(d,'w40')}" alt="">${d.name_ja}</div><small>${d.name_en.toUpperCase()} · #${d.fifa_rank}</small>`))
    .on('mouseleave',hideTip)
    .on('click',(e,d)=>{e.stopPropagation();openCountry(d);});
  drawLabels();
}
function drawLabels(){
  gLab.selectAll('text').data(showLabels?T:[],d=>d.id).join('text')
    .attr('class','mlabel')
    .attr('x',d=>projection([d.longitude,d.latitude])[0])
    .attr('y',d=>projection([d.longitude,d.latitude])[1]- (8/curK) -3)
    .attr('text-anchor','middle')
    .style('font-size',(11/curK)+'px')
    .text(d=>d.name_ja);
}
function showTip(e,html){tooltip.innerHTML=html;tooltip.style.display='block';
  tooltip.style.left=e.clientX+'px';tooltip.style.top=e.clientY+'px';}
function hideTip(){tooltip.style.display='none';}

/* ---------- ZOOM / PAN ---------- */
const zoom=d3.zoom().scaleExtent([1,9]).on('zoom',ev=>{
  gZoom.attr('transform',ev.transform);curK=ev.transform.k;
  gMk.selectAll('circle').attr('r',d=>(4+(1-Math.min(d.fifa_rank,70)/70)*5)/curK);
  drawLabels();
});
svg.call(zoom).on('dblclick.zoom',null);
document.getElementById('zin').onclick=()=>svg.transition().call(zoom.scaleBy,1.6);
document.getElementById('zout').onclick=()=>svg.transition().call(zoom.scaleBy,1/1.6);
document.getElementById('zreset').onclick=()=>svg.transition().call(zoom.transform,d3.zoomIdentity);
function flyTo(t){const[x,y]=projection([t.longitude,t.latitude]);const k=4;
  svg.transition().duration(700).call(zoom.transform,
    d3.zoomIdentity.translate(W/2,H/2).scale(k).translate(-x,-y));}

addEventListener('resize',()=>{W=innerWidth;H=innerHeight;svg.attr('viewBox',`0 0 ${W} ${H}`);
  const feats=gCountry.selectAll('path').data();
  if(feats.length){projection.fitExtent([[10,70],[W-10,H-20]],{type:'FeatureCollection',features:feats});
    gCountry.selectAll('path').attr('d',path);gGrat.select('path').attr('d',path);drawMarkers();}});

/* ---------- LEGEND ---------- */
const legend=document.getElementById('legend');let confFilter=null;
Object.entries(CONF).forEach(([k,v])=>{
  const cnt=T.filter(t=>t.confederation===k).length;
  const row=document.createElement('div');row.className='row';
  row.innerHTML=`<span class="dot" style="background:${v.c}"></span>${k} · ${v.ja} <span style="margin-left:auto;color:#9aa3b5">(${cnt})</span>`;
  row.onclick=()=>{confFilter=confFilter===k?null:k;
    gMk.selectAll('circle').style('display',d=>!confFilter||d.confederation===confFilter?'':'none');
    gLab.selectAll('text').style('display',d=>!confFilter||d.confederation===confFilter?'':'none');
    [...legend.querySelectorAll('.row')].forEach(r=>r.style.opacity=confFilter?.5:1);
    if(confFilter)row.style.opacity=1;};
  legend.appendChild(row);
});

/* ---------- TOGGLES ---------- */
const lb=document.getElementById('labelBtn');
lb.onclick=()=>{showLabels=!showLabels;lb.classList.toggle('active',showLabels);drawLabels();};
const cb=document.getElementById('colorBtn');
cb.onclick=()=>{colorMode=colorMode==='flag'?'conf':'flag';
  cb.textContent=colorMode==='flag'?'マーカー: 国旗色':'マーカー: 連盟色';
  gMk.selectAll('circle').attr('fill',d=>markerFill(d));};

/* ---------- SEARCH ---------- */
const si=document.getElementById('search'),sr=document.getElementById('sresults');
si.addEventListener('input',()=>{const q=si.value.trim().toLowerCase();
  if(!q){sr.style.display='none';return;}
  const res=T.filter(t=>t.name_ja.toLowerCase().includes(q)||t.name_en.toLowerCase().includes(q)||t.iso3.toLowerCase().includes(q)).slice(0,8);
  sr.innerHTML=res.map(t=>`<div data-id="${t.id}"><img class="flag-sm" src="${flagURL(t,'w40')}" alt=""><b>${t.name_ja}</b><span style="color:#6b7488;margin-left:auto">${t.name_en}</span></div>`).join('');
  sr.style.display=res.length?'block':'none';});
sr.addEventListener('click',e=>{const d=e.target.closest('[data-id]');if(!d)return;
  const t=T.find(x=>x.id==d.dataset.id);sr.style.display='none';si.value='';flyTo(t);openCountry(t);});
document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap'))sr.style.display='none';});

/* ---------- RADAR (D3-style SVG) ---------- */
function radarSVG(t,size,colors){
  const fields=[['style_attack','攻撃'],['style_technique','技術'],['style_physical','フィジカル'],['style_organization','組織'],['style_defense','守備']];
  const cx=size/2,cy=size/2,rad=size/2-28,n=fields.length,ang=i=>(Math.PI*2*i/n)-Math.PI/2;let g='';
  for(let r=1;r<=4;r++){let p=fields.map((_,i)=>{const rr=rad*r/4;return [cx+rr*Math.cos(ang(i)),cy+rr*Math.sin(ang(i))];});
    g+=`<polygon points="${p.map(a=>a.join(',')).join(' ')}" fill="none" stroke="rgba(20,32,64,.10)"/>`;}
  fields.forEach((f,i)=>{g+=`<line x1="${cx}" y1="${cy}" x2="${cx+rad*Math.cos(ang(i))}" y2="${cy+rad*Math.sin(ang(i))}" stroke="rgba(20,32,64,.10)"/>`;
    const lx=cx+(rad+15)*Math.cos(ang(i)),ly=cy+(rad+15)*Math.sin(ang(i));
    g+=`<text x="${lx}" y="${ly}" fill="#6b7488" font-size="10" text-anchor="middle" dominant-baseline="middle">${f[1]}</text>`;});
  (Array.isArray(t)?t:[t]).forEach((tt,si)=>{const col=colors[si];
    const pts=fields.map((f,i)=>{const v=tt[f[0]]/10;return [cx+rad*v*Math.cos(ang(i)),cy+rad*v*Math.sin(ang(i))];});
    g+=`<polygon points="${pts.map(a=>a.join(',')).join(' ')}" fill="${col}28" stroke="${col}" stroke-width="2"/>`;
    pts.forEach(p=>g+=`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${col}"/>`);});
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${g}</svg>`;
}

/* ---------- COUNTRY PANEL ---------- */
const panel=document.getElementById('panel');
function openCountry(t){
  const c=CONF[t.confederation];
  panel.innerHTML=`
  <button class="pclose" onclick="document.getElementById('panel').classList.remove('open')">✕</button>
  <div class="phead">
    <div class="band" style="background:${flagBand(t)}"></div>
    <img class="flagimg" src="${flagURL(t,'w320')}" alt="${t.name_en} flag">
    <div class="cname">${t.name_ja}</div>
    <div class="cname-en">${t.name_en.toUpperCase()} · ${t.capital_city}</div>
    <div class="badges">
      <span class="badge rank">FIFA #${t.fifa_rank}</span>
      <span class="badge grp">Group ${t.wc_group}</span>
      <span class="badge" style="border-color:${c.c};color:${c.c}">${t.confederation}</span>
      <span class="badge">${t.wc_appearances}回出場</span>
    </div>
  </div>
  <div class="sec"><h3>能力 / ABILITY</h3><div class="radar-wrap">${radarSVG(t,260,[t.flag_color1_hex||'#1d6cff'])}</div></div>
  <div class="sec"><h3>プレースタイル / STYLE</h3><p class="txt"><span class="em">${t.style_main_ja}</span><br>${t.style_keywords_ja}</p></div>
  <div class="sec"><h3>スカッド / SQUAD</h3><div class="kv">
    <div class="cell"><div class="l">注目選手</div><div class="v" style="font-size:14px">${t.star_player_ja||'—'}</div></div>
    <div class="cell"><div class="l">監督</div><div class="v" style="font-size:14px">${t.coach_name_ja||'—'}<br><small>${t.coach_nationality_ja||''}</small></div></div>
    <div class="cell"><div class="l">市場価値</div><div class="v">£${fmt(t.squad_mkt_val_gbpm)}<small>M</small></div></div>
    <div class="cell"><div class="l">平均年齢</div><div class="v">${t.squad_avg_age}<small>歳</small></div></div>
    <div class="cell"><div class="l">海外組比率</div><div class="v">${t.overseas_pct}<small>%</small></div></div>
    <div class="cell"><div class="l">プロ選手数</div><div class="v">${fmt(t.pro_players_male)}</div></div></div></div>
  <div class="sec"><h3>W杯通算成績 / WC RECORD</h3><div class="kv">
    <div class="cell"><div class="l">優勝</div><div class="v" style="color:var(--gold)">${'★'.repeat(t.wc_titles)||'—'} ${t.wc_titles}</div></div>
    <div class="cell"><div class="l">最高成績</div><div class="v" style="font-size:13px">${t.wc_best_result_ja||'—'}</div></div>
    <div class="cell full"><div class="l">通算 勝-分-負</div><div class="v">${t.wc_wins} - ${t.wc_draws} - ${t.wc_losses}</div></div>
    <div class="cell"><div class="l">通算得点</div><div class="v" style="color:var(--green)">${t.wc_goals_for}</div></div>
    <div class="cell"><div class="l">通算失点</div><div class="v" style="color:var(--accent2)">${t.wc_goals_against}</div></div></div></div>
  <div class="sec"><h3>国民性 / NATIONAL CHARACTER</h3><p class="txt"><span class="em">${t.national_char_short}</span><br>${t.national_char_detail}</p></div>
  <div class="sec"><h3>国の概要 / COUNTRY</h3><div class="kv">
    <div class="cell"><div class="l">人口</div><div class="v">${fmt(t.population_10k)}<small>万人</small></div></div>
    <div class="cell"><div class="l">1人当たりGDP</div><div class="v">$${fmt(t.gdp_per_capita_usd)}</div></div>
    <div class="cell full"><div class="l">国内トップリーグ</div><div class="v" style="font-size:14px">${t.top_league_ja} <small>(${t.top_league}・${t.league_teams}チーム)</small></div></div>
    <div class="cell full"><div class="l">出場資格</div><div class="v" style="font-size:13px">${t.qualification_ja||'—'}</div></div></div></div>
  <button class="cmpbtn" onclick="window._cmpFrom(${t.id})">⚖ この国を比較に追加</button>`;
  panel.classList.add('open');panel.scrollTop=0;
}
window._cmpFrom=id=>openCmp(id,null);

/* ---------- COMPARE ---------- */
const cmp=document.getElementById('cmp'),cmpgrid=document.getElementById('cmpgrid');
let A=T[0].id,B=T[1].id;
document.getElementById('cmpOpen').onclick=()=>openCmp(A,B);
document.getElementById('cmpClose').onclick=()=>cmp.classList.remove('open');
function opts(sel){return T.slice().sort((a,b)=>a.fifa_rank-b.fifa_rank).map(t=>`<option value="${t.id}" ${t.id==sel?'selected':''}>${t.name_ja} (#${t.fifa_rank})</option>`).join('');}
const ROWS=[
  ['FIFAランク','fifa_rank',v=>'#'+v,'low'],
  ['攻撃力','style_attack',v=>v,'high'],['守備力','style_defense',v=>v,'high'],
  ['テクニック','style_technique',v=>v,'high'],['フィジカル','style_physical',v=>v,'high'],['組織力','style_organization',v=>v,'high'],
  ['W杯優勝','wc_titles',v=>'★'+v,'high'],['W杯出場','wc_appearances',v=>v+'回','high'],
  ['通算勝利','wc_wins',v=>v,'high'],['通算得点','wc_goals_for',v=>v,'high'],
  ['市場価値','squad_mkt_val_gbpm',v=>'£'+fmt(v)+'M','high'],
  ['平均年齢','squad_avg_age',v=>v+'歳','none'],['海外組','overseas_pct',v=>v+'%','none'],
  ['人口','population_10k',v=>fmt(v)+'万','none'],['1人当GDP','gdp_per_capita_usd',v=>'$'+fmt(v),'high'],
];
function openCmp(a,b){cmp.classList.add('open');A=a||A;B=b||B;if(A===B)B=T.find(t=>t.id!==A).id;render();}
function render(){
  const ta=T.find(t=>t.id==A),tb=T.find(t=>t.id==B);
  let h=`<div><select class="cmpsel" id="selA">${opts(A)}</select>
    <div class="cmpcard"><div class="band2" style="background:${flagBand(ta)}"></div>
      <img class="fi" src="${flagURL(ta,'w320')}" alt=""><div class="n">${ta.name_ja}</div><div class="e">${ta.name_en.toUpperCase()}</div></div></div>
   <div></div>
   <div><select class="cmpsel" id="selB">${opts(B)}</select>
    <div class="cmpcard"><div class="band2" style="background:${flagBand(tb)}"></div>
      <img class="fi" src="${flagURL(tb,'w320')}" alt=""><div class="n">${tb.name_ja}</div><div class="e">${tb.name_en.toUpperCase()}</div></div></div>`;
  ROWS.forEach(r=>{const va=ta[r[1]],vb=tb[r[1]];let wa='',wb='';
    if(r[3]==='high'){if(va>vb){wa='win';wb='lose';}else if(vb>va){wb='win';wa='lose';}}
    if(r[3]==='low'){if(va<vb){wa='win';wb='lose';}else if(vb<va){wb='win';wa='lose';}}
    h+=`<div class="cval left ${wa}">${r[2](va)}</div><div class="cmplabel">${r[0]}</div><div class="cval right ${wb}">${r[2](vb)}</div>`;});
  h+=`<div class="cradar"><div style="text-align:center"><div style="font-size:10px;letter-spacing:.2em;color:#6b7488;margin-bottom:8px">能力レーダー比較</div>
    ${radarSVG([ta,tb],300,[ta.flag_color1_hex||'#1d6cff',tb.flag_color1_hex||'#ff4d6d'])}
    <div style="margin-top:10px;font-size:12px"><span style="color:${ta.flag_color1_hex||'#1d6cff'}">● ${ta.name_ja}</span> &nbsp; <span style="color:${tb.flag_color1_hex||'#ff4d6d'}">● ${tb.name_ja}</span></div></div></div>`;
  cmpgrid.innerHTML=h;
  document.getElementById('selA').onchange=e=>{A=+e.target.value;if(A===B)B=T.find(t=>t.id!==A).id;render();};
  document.getElementById('selB').onchange=e=>{B=+e.target.value;if(A===B)A=T.find(t=>t.id!==B).id;render();};
}

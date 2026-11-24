import {renderTracker} from './tracker-view.js?v=table-fit-1';
import {routeState,trackerHash,decorateBills} from './explore.js?v=table-fit-1';
import {changelogPage,reviewedDate} from './changelog.js?v=1';
import {companionStats} from './companions.js';
import {applyCongressData} from './congress.js?v=atlas-next-1';
import {chartSpecs,patternsHash,readPatternsHash} from './chart-export.js?v=atlas-next-1';
import {addChartActions} from './chart-actions.js?v=atlas-next-1';
import {engagementUrl,engagementDescription,engagementContext} from './engagement.js?v=atlas-next-1';
import {summarize,leadSponsorRankings} from './charts.js';
import {normalize,filterBills,topicCounts,csv} from './model.js?v=atlas-next-1';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let raw=[],bills=[],page=1,filters={q:'',chamber:'',topic:'',engagement:''};
const main=$('main'),dialog=$('#detail');
let chartsChamber='',requestedChart='',snapshot={},research={},officialChanges={},releases=[],familyData=[];
const date=s=>s?new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'Not recorded';
const badge=b=>{if(!b.engagement)return '<span class="sub">No engagement recorded</span>';const label=esc(b.engagement.replace(/\.$/,'')),style=b.engagement.toLowerCase()==='endorsed.'?'green':'amber',url=engagementUrl(b);return url?'<a class="tag '+style+'" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+label+': public SIIA material for '+esc(b.id)+' (opens in a new tab)" title="'+esc(engagementDescription(b))+'">'+label+'</a>':'<span class="tag '+style+'" title="Public SIIA material has not been linked for this bill">'+label+'</span>';};
function show(html){$('#dialog-body').innerHTML=html;dialog.showModal();}
$('.close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});


const preference=window.matchMedia('(prefers-color-scheme: dark)');
let savedTheme;try{savedTheme=localStorage.getItem('atlas-theme')}catch{}
function setTheme(theme){document.documentElement.dataset.theme=theme;const dark=theme==='dark';$('#favicon').href=dark?'./favicon-dark.ico':'./favicon.ico';$('#theme-toggle').setAttribute('aria-pressed',String(dark));$('#theme-toggle').setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');$('#theme-toggle').title=dark?'Switch to light mode':'Switch to dark mode';$('#theme-toggle').innerHTML='<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">'+(dark?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>':'<path d="M20.5 13a8.5 8.5 0 0 1-9.5-9.5A8.5 8.5 0 1 0 20.5 13Z"/>')+'</svg>';}
setTheme(savedTheme==='dark'||savedTheme==='light'?savedTheme:preference.matches?'dark':'light');
$('#theme-toggle').onclick=()=>{savedTheme=document.documentElement.dataset.theme==='dark'?'light':'dark';setTheme(savedTheme);try{localStorage.setItem('atlas-theme',savedTheme)}catch{}};
preference.addEventListener('change',e=>{if(!savedTheme)setTheme(e.matches?'dark':'light')});

function tracker(){renderTracker({main,bills,families:familyData,filters,page,badge,onState:(next,p)=>{filters={...next};page=p;},onChart:(chamber,chart)=>navigateChart(chamber,chart),onBill:billDetail});}
function navigateChart(chamber,chart){chartsChamber=chamber;requestedChart=chart;showView('charts',{chamber,chart},true);}

function billDetail(id){const b=bills.find(x=>x.id===id);if(!b)return;show(`<span class="eyebrow">119th Congress · ${b.chamber}</span><h2>${esc(b.title)}</h2><p><span class="bill-id">${esc(b.id)}</span> &nbsp; ${badge(b)}</p>${engagementContext(b)?`<p class="small-note">${esc(engagementContext(b))}</p>`:''}<dl><dt>Status</dt><dd>${esc(b.stage)}</dd><dt>Last action date</dt><dd>${date(b.lastActionDate)}</dd><dt>Primary focus</dt><dd>${esc(b.primary)}</dd><dt>Secondary focus</dt><dd>${esc(b.secondary)||'Not recorded'}</dd><dt>Lead sponsors</dt><dd>${esc(b.sponsor)}</dd><dt>Cosponsors (${esc(b.cosponsorCount)})</dt><dd>${esc(b.cosponsors)||(Number(b.cosponsorCount)===0?'None':'Not recorded')}</dd><dt>Introduction date</dt><dd>${date(b.introduced)}</dd>${b.congressData?`<dt>Congress.gov checked</dt><dd>${new Date(b.congressData.verifiedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</dd>`:''}</dl>${b.companions?.length?`<h3>Companion bills</h3><p>${b.companions.map(c=>`<button class="bill-number" data-bill="${esc(c.id)}">${esc(c.id)}</button>`).join(' · ')}</p>`:''}<h3>Latest recorded action</h3><p>${esc(b.action)||'Not recorded'}</p><h3>Summary</h3><p>${esc(b.summary)||'Not recorded'}</p><details class="bill-research"><summary>Sources and research reviews</summary><dl><dt>Focus-area review</dt><dd>${reviewedDate(research.focusReviewedAt)}</dd>${research.summaryReviewedAt?.[b.id]?`<dt>Summary maintenance</dt><dd>${reviewedDate(research.summaryReviewedAt[b.id])}</dd>`:''}<dt>Classification</dt><dd>Editorial research</dd><dt>Official facts</dt><dd>Congress.gov</dd></dl><p>${esc(research.definitions?.[b.primary]||'')}</p>${research.events?.find(e=>e.kind==='Classification')?.changes?.find(c=>c.id===b.id)?`<p>${esc(research.events.find(e=>e.kind==='Classification').changes.find(c=>c.id===b.id).reason)}</p>`:''}<button class="text-button" data-view-link="changelog">View changelog</button></details>${b.actionHistory?.length?`<details><summary>Official action history (${b.actionHistory.length})</summary><ol class="action-history">${[...b.actionHistory].reverse().map(a=>`<li><time>${date(a.date)}</time><p>${esc(a.text)}</p></li>`).join('')}</ol></details>`:''}<p><a class="textlink" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">View on Congress.gov</a></p>`);}
function download(name,value,type){const url=URL.createObjectURL(new Blob([value],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function legend(){if(chartsChamber)return '<span class="chart-key"><i class="'+chartsChamber.toLowerCase()+'-swatch"></i>'+chartsChamber+'</span>';return '<span class="chart-key"><i class="house-swatch"></i>House</span><span class="chart-key"><i class="senate-swatch"></i>Senate</span>';}
function monthlyChart(months){
 const width=560,height=250,left=35,right=12,top=16,bottom=70,plotHeight=height-top-bottom,plotWidth=width-left-right,base=top+plotHeight;
 const maximum=Math.max(1,...months.map(m=>m.total)),step=Math.max(1,Math.ceil(maximum/4)),ceiling=Math.ceil(maximum/step)*step,slot=plotWidth/months.length,bar=slot*.64;
 let marks='';
 for(let n=0;n<=ceiling;n+=step){const y=base-n/ceiling*plotHeight;marks+=`<line class="chart-gridline" x1="${left}" x2="${width-right}" y1="${y}" y2="${y}"/><text class="chart-axis" x="${left-8}" y="${y+4}" text-anchor="end">${n}</text>`;}
 months.forEach((m,i)=>{const center=left+(i+.5)*slot,x=center-bar/2,house=m.House/ceiling*plotHeight,senate=m.Senate/ceiling*plotHeight,label=new Date(m.month+'-15T12:00:00').toLocaleDateString('en-US',{month:'short',year:'numeric'});marks+=`<g><title>${label}: House ${m.House}, Senate ${m.Senate}, total ${m.total}</title><rect class="house-fill" x="${x}" y="${base-house}" width="${bar}" height="${house}"/><rect class="senate-fill" x="${x}" y="${base-house-senate}" width="${bar}" height="${senate}"/></g><line class="month-tick" x1="${center}" x2="${center}" y1="${base}" y2="${base+4}"/>`;if(i%3===0)marks+=`<text class="chart-month" x="${center}" y="${base+21}" text-anchor="middle">${label.split(' ')[0]}</text>`;});
 for(let year=0;year<2;year++){const x0=left+year*slot*12+10,x1=left+(year+1)*slot*12-10,y=base+35;marks+=`<path class="year-bracket" d="M${x0} ${y}H${x1}"/><text class="chart-year" x="${(x0+x1)/2}" y="${base+56}" text-anchor="middle">${2025+year}</text>`;}
 return `<svg class="monthly-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly bill introductions, grouped under 2025 and 2026. Each bar is one month, stacked by House and Senate. Exact values are listed below.">${marks}</svg>`;
}
function patternCharts(data){
 const pairMax=Math.max(1,...data.pairs.map(p=>p.total));
 const bandMax=Math.max(1,...data.cosponsorBands.map(b=>b.total));
 const engagedTopics=data.topics.filter(t=>t.endorsed+t.engaged>0).sort((a,b)=>(b.endorsed+b.engaged)-(a.endorsed+a.engaged)||a.name.localeCompare(b.name));
 return `<div class="pattern-grid"><section class="chart-panel"><div class="chart-heading"><h2>Top 8 primary–secondary focus-area pairs</h2><div class="chart-legend">${legend()}</div></div><div class="topic-bars">${data.pairs.slice(0,8).map(p=>`<div class="topic-row pair-row" aria-label="${esc(p.names.join(' and '))}: House ${p.House}, Senate ${p.Senate}, total ${p.total}"><span>${esc(p.names[0])}<span class="pair-second">+ ${esc(p.names[1])}</span></span><div class="bar-space"><div class="stacked-bar" style="width:${p.total/pairMax*100}%"><span class="house-fill" style="width:${p.House/p.total*100}%" title="House: ${p.House}"></span><span class="senate-fill" style="width:${p.Senate/p.total*100}%" title="Senate: ${p.Senate}"></span></div></div><strong>${p.total}</strong></div>`).join('')}</div></section>
 <section class="chart-panel"><div class="chart-heading"><h2>Cosponsor distribution</h2><div class="chart-legend">${legend()}</div></div><div class="distribution-label">Cosponsors per bill <span>Number of bills</span></div><div class="topic-bars">${data.cosponsorBands.map(b=>`<div class="topic-row band-row" aria-label="${b.label} cosponsors: House ${b.House}, Senate ${b.Senate}, total ${b.total}"><span>${b.label}</span><div class="bar-space"><div class="stacked-bar" style="width:${b.total/bandMax*100}%"><span class="house-fill" style="width:${b.total?b.House/b.total*100:0}%" title="House: ${b.House}"></span><span class="senate-fill" style="width:${b.total?b.Senate/b.total*100:0}%" title="Senate: ${b.Senate}"></span></div></div><strong>${b.total}</strong></div>`).join('')}</div></section>
 <section class="chart-panel engagement-pattern"><div class="chart-heading"><h2>SIIA engagement across policy areas</h2><div class="chart-legend"><span class="chart-key"><i class="endorsed-swatch"></i>Endorsed</span><span class="chart-key"><i class="engaged-swatch"></i>Engaged, not endorsed</span></div></div><div class="distribution-label"><span>Focus area</span><span>Engaged / total</span></div><div class="engagement-topic-bars">${engagedTopics.map(t=>`<div class="engagement-topic-row" aria-label="${esc(t.name)}: ${t.endorsed} endorsed, ${t.engaged} engaged but not endorsed, out of ${t.total} bills"><span>${esc(t.name)}</span><div class="status-track"><div class="engagement-stack"><span class="endorsed-swatch" style="width:${t.endorsed/t.total*100}%"></span><span class="engaged-swatch" style="width:${t.engaged/t.total*100}%"></span></div></div><strong>${t.endorsed+t.engaged} / ${t.total}</strong><span class="chart-percent">${Math.round((t.endorsed+t.engaged)/t.total*100)}%</span></div>`).join('')||'<p class="chart-empty">No engagement recorded.</p>'}</div></section></div>`;
}
function sponsorPanel(chamber,rankings,maximum){
 const people=rankings[chamber],leaders=people.slice(0,10);
 const panel=document.createElement('section');panel.className='chart-panel sponsor-panel';
 panel.innerHTML=`<div class="chart-heading"><h3>Top 10 leading ${chamber} sponsors</h3></div><div class="sponsor-bars" role="img" aria-label="Top 10 leading ${chamber} sponsors by number of tracked bills. ${leaders.map(p=>esc(p.name)+': '+p.count).join('; ')}">${leaders.map(p=>`<div class="sponsor-row"><span>${esc(p.name)}</span><div class="sponsor-bar-track"><div class="sponsor-bar ${chamber==='House'?'house-fill':'senate-fill'}" style="width:${p.count/maximum*100}%"></div></div><strong>${p.count}</strong></div>`).join('')}</div><div class="sponsor-scale" aria-label="Bills led, scale from 0 to ${maximum}"><span aria-hidden="true"></span><div><div class="sponsor-ticks">${Array.from({length:maximum+1},(_,i)=>"<span>"+i+"</span>").join("")}</div><span class="sponsor-unit">Bills led</span></div><span aria-hidden="true"></span></div><details class="chart-values"><summary>View all ${chamber} sponsors</summary><table class="chart-table"><thead><tr><th scope="col">Lead sponsor</th><th scope="col">Tracked bills</th></tr></thead><tbody>${people.map(p=>`<tr><td>${esc(p.name)}</td><td>${p.count}</td></tr>`).join('')}</tbody></table></details>`;
 return panel;
}
function organizeCharts(data){
 const panels=[...main.querySelectorAll('.chart-panel')],lookup=new Map(panels.map(panel=>[panel.querySelector('.chart-heading h2').textContent,panel]));
 const dashboard=document.createElement('div');dashboard.className='overview-grid';
 const rankings=leadSponsorRankings(bills),maximum=Math.max(1,...Object.values(rankings).flat().map(p=>p.count));
 const sponsors=(chartsChamber?[chartsChamber]:['House','Senate']).map(chamber=>sponsorPanel(chamber,rankings,maximum));
 const specs=chartSpecs(bills,chartsChamber);
 const partySpec=specs.find(s=>s.id==='sponsor-party');let partyPanel;
 if(partySpec){partyPanel=document.createElement('section');partyPanel.className='chart-panel';const partyMax=Math.max(1,...partySpec.rows.map(r=>r.values.reduce((a,b)=>a+b,0)));partyPanel.innerHTML='<div class="chart-heading"><h2>Lead sponsor party by chamber</h2><div class="chart-legend">'+legend()+'</div></div><div class="topic-bars party-bars">'+partySpec.rows.map(r=>{const total=r.values.reduce((a,b)=>a+b,0);return '<div class="topic-row" aria-label="'+esc(r.label)+': House '+r.values[0]+', Senate '+r.values[1]+'"><span>'+esc(r.label)+'</span><div class="bar-space"><div class="stacked-bar" style="width:'+total/partyMax*100+'%"><span class="house-fill" style="width:'+r.values[0]/total*100+'%" title="House: '+r.values[0]+'"></span><span class="senate-fill" style="width:'+r.values[1]/total*100+'%" title="Senate: '+r.values[1]+'"></span></div></div><strong>'+total+'</strong></div>';}).join('')+'</div><details class="chart-values"><summary>View exact counts</summary><table class="chart-table"><thead><tr><th>Party</th><th>House</th><th>Senate</th><th>Total</th></tr></thead><tbody>'+partySpec.rows.map(r=>'<tr><td>'+esc(r.label)+'</td><td>'+r.values[0]+'</td><td>'+r.values[1]+'</td><td>'+r.values.reduce((a,b)=>a+b,0)+'</td></tr>').join('')+'</tbody></table></details>';}

 const companionPanels=specs.filter(s=>s.id.startsWith('companion-')).map(spec=>{
  const panel=document.createElement('section');panel.className='chart-panel';const maximum=Math.max(1,...spec.rows.map(r=>r.values.reduce((a,b)=>a+b,0))),stats=companionStats(bills,chartsChamber),coverage=spec.id==='companion-coverage';
  panel.innerHTML='<div class="chart-heading"><h2>'+esc(spec.title)+'</h2>'+(coverage?'<div class="chart-legend">'+legend()+'</div>':'')+'</div><div class="distribution-label"><span>'+(coverage?'Tracked bills':'Days between first House and Senate introductions')+'</span><span>'+(coverage?'Bills':'Bill families')+'</span></div><div class="topic-bars">'+spec.rows.map(r=>{const total=r.values.reduce((a,b)=>a+b,0);return '<div class="topic-row" aria-label="'+esc(r.label)+': '+total+'"><span>'+esc(r.label)+'</span><div class="bar-space"><div class="stacked-bar" style="width:'+total/maximum*100+'%">'+r.values.map((v,i)=>'<span '+(coverage?'class="'+(i===0?'house-fill':'senate-fill')+'"':'')+' style="'+(!coverage?'background:var(--muted);':'')+'width:'+(total?v/total*100:0)+'%" title="'+esc(spec.series[i].label)+': '+v+'"></span>').join('')+'</div></div><strong>'+total+'</strong></div>';}).join('')+'</div><details class="chart-values"><summary>'+(coverage?'View exact counts':'View companion families ('+stats.families.length+')')+'</summary>'+(coverage?'<table class="chart-table"><thead><tr><th>Coverage</th><th>House</th><th>Senate</th><th>Total</th></tr></thead><tbody>'+stats.coverage.map(r=>'<tr><td>'+esc(r.label)+'</td><td>'+r.House+'</td><td>'+r.Senate+'</td><td>'+r.total+'</td></tr>').join('')+'</tbody></table>':'<table class="chart-table"><thead><tr><th>Bill family</th><th>First House introduction</th><th>First Senate introduction</th><th>Days apart</th></tr></thead><tbody>'+stats.families.map(f=>'<tr><td>'+f.ids.map(id=>'<button class="bill-number" data-bill="'+esc(id)+'">'+esc(id)+'</button>').join(' · ')+'</td><td>'+date(f.house.introduced)+'</td><td>'+date(f.senate.introduced)+'</td><td>'+f.gap+'</td></tr>').join('')+'</tbody></table>')+'</details>';return panel;
 });
 const ordered=[lookup.get('Bill introductions by month'),lookup.get('Top 10 focus areas by bill count'),...sponsors,lookup.get('Top 8 primary–secondary focus-area pairs'),lookup.get('SIIA engagement across policy areas'),lookup.get('Cosponsor distribution'),lookup.get('Top 10 bills by cosponsor count'),lookup.get('SIIA engagement'),partyPanel,...companionPanels];
 for(const panel of ordered.filter(Boolean)){
  panel.classList.remove('engagement-pattern');
  const heading=panel.querySelector('.chart-heading h3');if(heading){const h2=document.createElement('h2');h2.textContent=heading.textContent;heading.replaceWith(h2);}
  const plot=document.createElement('div');plot.className='overview-plot';
  for(const child of [...panel.children])if(!child.matches('.chart-heading,.chart-note,.chart-values,.sponsor-scale'))plot.append(child);
  const footer=panel.querySelector('.sponsor-scale,.chart-values');if(footer)panel.insertBefore(plot,footer);else panel.append(plot);
  const sponsorScale=panel.querySelector('.sponsor-scale');if(sponsorScale)plot.append(sponsorScale);
  const title=panel.querySelector('.chart-heading h2').textContent;
  const spec=specs.find(s=>s.title===title);if(spec){addChartActions(panel,spec,chartsChamber);wirePlotLinks(panel,spec);}
  const cardFooter=document.createElement('div');cardFooter.className='chart-footer';
  const values=panel.querySelector('.chart-values'),actions=panel.querySelector('.chart-actions');
  if(actions)panel.querySelector('.chart-heading').append(actions);if(values){cardFooter.append(values);panel.append(cardFooter);}
  const list=plot.querySelector('.cosponsor-list');if(list){const labels=document.createElement('div');labels.className='distribution-label';labels.innerHTML='<span>Bill</span><span>Cosponsors</span>';list.before(labels);}
  dashboard.append(panel);
 }
 const original=main.querySelector('.chart-layout'),patterns=main.querySelector('.pattern-grid');original.before(dashboard);original.remove();patterns.remove();
}

function wirePlotLinks(panel,spec){
 const base=chartsChamber?{chamber:chartsChamber}:{};
 panel.querySelector('.sponsor-bars')?.setAttribute('role','group');
 const attach=(node,selection,label,keyboard=true)=>{if(!node)return;const tag=node.tagName.toLowerCase();if((tag==='rect'&&Number(node.getAttribute('height'))<=0)||(tag==='span'&&node.style.width&&Number.parseFloat(node.style.width)<=0))return;node.dataset.explore=JSON.stringify(selection);node.classList.add('explore-target');node.title='View matching bills in Tracker';if(keyboard){node.tabIndex=0;node.setAttribute('role','link');node.setAttribute('aria-label',(node.getAttribute('aria-label')||label)+'. View matching bills in Tracker');}};
 if(spec.id==='monthly-introductions'){
  panel.querySelector('.monthly-chart')?.setAttribute('role','group');
  panel.querySelectorAll('.monthly-chart g').forEach((node,i)=>{const row=spec.rows[i];attach(node,{...base,month:row.label},row.label);node.querySelectorAll('rect').forEach((rect,j)=>attach(rect,{month:row.label,chamber:j===0?'House':'Senate'},row.label,false));});return;
 }
 const selector=spec.id==='engagement-by-area'?'.engagement-topic-row':spec.id==='siia-engagement'?'.status-row':spec.id.endsWith('-sponsors')?'.sponsor-row':'.topic-row';
 panel.querySelectorAll(selector).forEach((node,i)=>{const row=spec.rows[i];if(!row)return;let selection={...base};
  if(spec.id==='focus-areas')selection={...base,topic:row.label,primaryOnly:'1'};
  else if(spec.id==='policy-overlap')selection={...base,pair:JSON.stringify(row.label.split(' + '))};
  else if(spec.id==='engagement-by-area')selection={...base,topic:row.label,primaryOnly:'1',engagement:'recorded'};
  else if(spec.id==='cosponsor-distribution')selection={...base,band:row.label.replace(' cosponsors','')};
  else if(spec.id==='siia-engagement')selection={...base,engagement:i===0?'endorsed':i===1?'engaged':'unrecorded'};
  else if(spec.id.endsWith('-sponsors'))selection={chamber:spec.scope,sponsor:row.label};
  else if(spec.id==='sponsor-party')selection={...base,party:['D','R','I','other'][i]};
  else if(spec.id==='companion-coverage')selection={...base,companion:i===0?'yes':'no'};
  else if(spec.id==='companion-gaps')selection={view:'families',gap:row.label};
  else return;
  attach(node,selection,row.label);
  if(['focus-areas','policy-overlap','cosponsor-distribution','sponsor-party','companion-coverage'].includes(spec.id))node.querySelectorAll('.stacked-bar>span').forEach((segment,j)=>attach(segment,{...selection,chamber:j===0?'House':'Senate'},row.label,false));
  if(spec.id==='engagement-by-area')node.querySelectorAll('.engagement-stack>span').forEach((segment,j)=>attach(segment,{...selection,engagement:j===0?'endorsed':'engaged'},row.label,false));
 });
}

function engagementDetails(rows){
 const groups=[{label:'Endorsed',style:'green',match:b=>b.engagement.toLowerCase()==='endorsed.'},{label:'Engaged, not endorsed',style:'amber',match:b=>b.engagement.toLowerCase().startsWith('engaged,')}].map(group=>({...group,bills:rows.filter(group.match).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}))}));
 const count=groups.reduce((n,g)=>n+g.bills.length,0);
 return `<details class="chart-values engagement-details"><summary>View engaged bills (${count})</summary><div class="engagement-bills">${groups.map(group=>`<section class="engagement-group" aria-label="${esc(group.label)} bills"><h3><span class="tag ${group.style}">${esc(group.label)}</span><span class="engagement-group-count">${group.bills.length}</span></h3>${group.bills.length?`<ul>${group.bills.map(b=>{const url=engagementUrl(b);return `<li><button type="button" class="engagement-bill" data-bill="${esc(b.id)}">${esc(b.id)} · ${esc(b.title)}</button><div class="engagement-bill-meta"><span>${esc(b.chamber)}</span>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(engagementDescription(b))}" aria-label="Public SIIA material for ${esc(b.id)} (opens in a new tab)">SIIA material ↗</a>`:''}</div></li>`;}).join('')}</ul>`:'<p class="chart-empty">No bills in this selection.</p>'}</section>`).join('')}</div></details>`;
}
function charts(){
 const data=summarize(bills,chartsChamber),max=Math.max(1,...data.topics.map(t=>t.total)),total=data.rows.length;
 const statuses=[['Endorsed',data.engagement.endorsed,'green'],['Engaged, not endorsed',data.engagement.engaged,'amber'],['No engagement recorded',data.engagement.unrecorded,'unrecorded']];
 main.innerHTML=`<section class="page-heading charts-heading"><div><h1>AI policy trends</h1><p>${total} bills tracked · 2025–2026</p></div><label>Chamber<select id="chart-chamber" aria-label="Chart chamber"><option value="">All chambers</option><option>House</option><option>Senate</option></select></label></section>
 
 <div class="chart-layout"><section class="chart-panel topics-panel"><div class="chart-heading"><h2>Top 10 focus areas by bill count</h2><div class="chart-legend">${legend()}</div></div>
 <div class="topic-bars">${data.topics.slice(0,10).map(t=>`<div class="topic-row" aria-label="${esc(t.name)}: House ${t.House}, Senate ${t.Senate}, total ${t.total}"><span>${esc(t.name)}</span><div class="bar-space"><div class="stacked-bar" style="width:${t.total/max*100}%"><span class="house-fill" style="width:${t.House/t.total*100}%" title="House: ${t.House}"></span><span class="senate-fill" style="width:${t.Senate/t.total*100}%" title="Senate: ${t.Senate}"></span></div></div><strong>${t.total}</strong></div>`).join('')}</div>
 <details class="chart-values"><summary>View exact counts</summary><table class="chart-table"><thead><tr><th>Focus area</th><th>House</th><th>Senate</th><th>Total</th></tr></thead><tbody>${data.topics.map(t=>`<tr><td>${esc(t.name)}</td><td>${t.House}</td><td>${t.Senate}</td><td>${t.total}</td></tr>`).join('')}</tbody></table></details></section>
 <div class="chart-right"><section class="chart-panel"><div class="chart-heading"><h2>Bill introductions by month</h2><div class="chart-legend">${legend()}</div></div>${monthlyChart(data.months)}<details class="chart-values"><summary>View monthly counts</summary><table class="chart-table"><thead><tr><th>Month</th><th>House</th><th>Senate</th><th>Total</th></tr></thead><tbody>${data.months.map(m=>`<tr><td>${m.month}</td><td>${m.House}</td><td>${m.Senate}</td><td>${m.total}</td></tr>`).join('')}</tbody></table></details></section>
 <section class="chart-panel"><div class="chart-heading"><h2>SIIA engagement</h2></div><div class="status-bars">${statuses.map(([label,count,type])=>`<div class="status-row"><span>${label}</span><div class="status-track"><div class="status-fill ${type}" style="width:${total?count/total*100:0}%"></div></div><strong>${count}</strong><span class="chart-percent">${total?Math.round(count/total*100):0}%</span></div>`).join('')}</div>${engagementDetails(data.rows)}</section>
 <section class="chart-panel"><div class="chart-heading"><h2>Top 10 bills by cosponsor count</h2></div><ol class="cosponsor-list">${data.topCosponsors.map(b=>`<li><div><button class="bill-number" data-bill="${esc(b.id)}">${esc(b.id)}</button><span>${esc(b.title)}</span></div><strong>${esc(b.cosponsorCount)}</strong></li>`).join('')}</ol></section></div></div>${patternCharts(data)}`;
 organizeCharts(data);
 $('#chart-chamber').value=chartsChamber;$('#chart-chamber').onchange=e=>{chartsChamber=e.target.value;history.replaceState(null,'',patternsHash(chartsChamber));charts()};
}
function showView(view,state,push=false){
 if(state){if(view==='tracker'){filters={...(state.filters||{})};page=state.page||1;}else if(view==='charts'){chartsChamber=state.chamber||'';requestedChart=state.chart||'';}}
 const selectedView=view;
 document.querySelectorAll('[data-view]').forEach(button=>{const selected=button.dataset.view===selectedView;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
 main.setAttribute('aria-labelledby',view==='charts'?'charts-tab':selectedView==='changelog'?'changelog-tab':'tracker-tab');
 const hash=view==='charts'?patternsHash(chartsChamber,requestedChart):view==='tracker'?trackerHash(filters,page):'#'+view+(state?.section?'?section='+state.section:'');
 if(location.hash!==hash)history[push?'pushState':'replaceState'](null,'',hash);
 if(view==='charts'){charts();if(requestedChart){const target=document.getElementById(requestedChart);if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));requestedChart='';}}
 else if(view==='changelog')main.innerHTML=changelogPage({research,snapshot,officialChanges,releases});
 else tracker();
 if(view!=='charts'||!state?.chart)window.scrollTo({top:0});
}
for(const button of document.querySelectorAll('[data-view]')){button.onclick=()=>showView(button.dataset.view,null,true);button.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=[...document.querySelectorAll('[data-view]')],i=tabs.indexOf(button),next=e.key==='Home'?tabs[0]:e.key==='End'?tabs.at(-1):tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];showView(next.dataset.view,null,true);next.focus();}};}
const restore=()=>{const state=routeState(location.hash);showView(state.view,state);};
window.addEventListener('hashchange',restore);window.addEventListener('popstate',restore);
function openTrackerSelection(selection,chart){filters={...selection,returnChart:chart,returnChamber:chartsChamber};page=1;showView('tracker',null,true);main.setAttribute('tabindex','-1');main.focus({preventScroll:true});}
document.addEventListener('click',e=>{const bill=e.target.closest('[data-bill]');if(bill){billDetail(bill.dataset.bill);return;}const nav=e.target.closest('[data-view-link]');if(nav){dialog.close();showView(nav.dataset.viewLink,null,true);return;}const plot=e.target.closest('[data-explore]');if(plot){let selection;try{selection=JSON.parse(plot.dataset.explore)}catch{return;}openTrackerSelection(selection,plot.closest('.chart-panel').id);}});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-explore]')){e.preventDefault();e.target.click();}});
try{
 const load=async name=>{const r=await fetch(new URL('./'+name,import.meta.url),{cache:'no-cache'});if(!r.ok)throw Error(name);return r.json();};
 const [source,official,review,activity,lifecycle,updates]=await Promise.all([load('bills.json'),load('congress-data.json').catch(()=>({})),load('research.json').catch(()=>({})),load('official-changes.json').catch(()=>({})),load('lifecycle.json').catch(()=>({})),load('changelog.json').catch(()=>([]))]);
 raw=source;snapshot=official;research=review;officialChanges=activity;releases=updates;bills=decorateBills(applyCongressData(normalize(raw),snapshot),lifecycle);familyData=companionStats(bills).families;restore();
}catch(error){console.error('Atlas initialization failed',error);main.innerHTML='<div class="notice">The tracker data could not be loaded. Refresh this page to try again.</div>';}


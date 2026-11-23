import {companionStats} from './companions.js';
import {summarize,leadSponsorRankings} from './charts.js';
const chamberSeries=[{label:'House',color:'#3974ad'},{label:'Senate',color:'#a765a5'}];
const statusSeries=[{label:'Endorsed',color:'#6baf81'},{label:'Engaged, not endorsed',color:'#d8b75a'}];
export function chartSpecs(bills,chamber=''){
 const companions=companionStats(bills,chamber);
 const data=summarize(bills,chamber),rankings=leadSponsorRankings(bills),scope=chamber||'House and Senate';
 const spec=(id,title,note,series,rows,extra={})=>({id,title,note,scope,kind:'bar',series,rows,...extra});
 const paired=items=>items.map(x=>({label:x.name,values:[x.House,x.Senate]}));
 const engaged=data.topics.filter(t=>t.endorsed+t.engaged>0).sort((a,b)=>(b.endorsed+b.engaged)-(a.endorsed+a.engaged)||a.name.localeCompare(b.name));
 return [
  spec('companion-coverage','House–Senate companion coverage','',chamberSeries,companions.coverage.map(r=>({label:r.label,values:[r.House,r.Senate]}))),
  spec('companion-gaps','Companion introduction gaps','',[{label:'Bill families',color:'#64748b'}],companions.bands.map(b=>({label:b.label,values:[b.count]})),{unit:'Bill families',scope:'House and Senate'}),
  spec('monthly-introductions','Bill introductions by month','',chamberSeries,data.months.map(m=>({label:m.month,values:[m.House,m.Senate]})),{kind:'monthly'}),
  spec('focus-areas','Top 10 focus areas by bill count','',chamberSeries,paired(data.topics.slice(0,10))),
  ...(chamber?[chamber]:['House','Senate']).map(c=>spec(c.toLowerCase()+'-sponsors','Top 10 leading '+c+' sponsors','',chamberSeries.filter(s=>s.label===c),rankings[c].slice(0,10).map(p=>({label:p.name,values:[p.count]})),{max:Math.max(1,...Object.values(rankings).flat().map(p=>p.count)),unit:'Bills led',scope:c})),
  spec('policy-overlap','Top 8 primary–secondary focus-area pairs','',chamberSeries,data.pairs.slice(0,8).map(p=>({label:p.names.join(' + '),values:[p.House,p.Senate]}))),
  spec('engagement-by-area','SIIA engagement across policy areas','',statusSeries,engaged.map(t=>({label:t.name,values:[t.endorsed,t.engaged],denominator:t.total,display:`${t.endorsed+t.engaged} / ${t.total} (${Math.round((t.endorsed+t.engaged)/t.total*100)}%)`})),{percentage:true,max:100,unit:'Share of tracked bills'}),
  spec('cosponsor-distribution','Cosponsor distribution','',chamberSeries,data.cosponsorBands.map(b=>({label:b.label+' cosponsors',values:[b.House,b.Senate]}))),
  spec('most-cosponsors','Top 10 bills by cosponsor count','',[{label:'Cosponsors',color:'#3974ad'}],data.topCosponsors.map(b=>({label:b.id+' · '+b.title,values:[Number(b.cosponsorCount)]})),{unit:'Cosponsors'}),
  ...(!chamber?[spec('sponsor-party','Lead sponsor party by chamber','',chamberSeries,['Democratic','Republican','Independent','Other / unspecified'].map((label,i)=>({label,values:['House','Senate'].map(c=>bills.filter(b=>b.chamber===c&&({'D':0,'R':1,'I':2}[String(b.sponsor).match(/\(([DRI])-/)?.[1]]??3)===i).length)})).filter(r=>r.values.some(Boolean)))]:[]),
  spec('siia-engagement','SIIA engagement','',[{label:'Bills',color:'#64748b'}],[{label:'Endorsed',values:[data.engagement.endorsed],color:'#6baf81'},{label:'Engaged, not endorsed',values:[data.engagement.engaged],color:'#d8b75a'},{label:'No engagement recorded',values:[data.engagement.unrecorded],color:'#a3abb4'}])
 ];
}
const xml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function wrap(text,limit=40){const words=String(text).split(/\s+/),lines=[];let line='';for(const word of words){if(line&&line.length+word.length+1>limit){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines.length?lines:[''];}
export function chartSvg(spec,theme='light'){
 const dark=theme==='dark',background=dark?'#181a1d':'#ffffff',axisColor=dark?'#343940':'#e3e6e9',textColor=dark?'#e4e6e9':'#20252b',muted=dark?'#abb1b9':'#616a74';
 const colors=dark?{'#3974ad':'#7ba7d2','#a765a5':'#c79cc6','#64748b':'#9baabd'}:{};
 const color=value=>colors[value]||value;
 spec={...spec,series:spec.series.map(s=>({...s,color:color(s.color)})),rows:spec.rows.map(r=>({...r,color:r.color?color(r.color):undefined}))};
 if(['House','Senate'].includes(spec.scope)&&spec.series.some(s=>s.label===spec.scope)){const indexes=spec.series.map((s,i)=>s.label===spec.scope?i:-1).filter(i=>i>=0);spec={...spec,series:indexes.map(i=>spec.series[i]),rows:spec.rows.map(r=>({...r,values:indexes.map(i=>r.values[i])}))};}
 const width=1200,left=455,right=1015,plotWidth=right-left,start=190;
 const legend=spec.series.length>1?spec.series.map((s,i)=>`<rect x="${40+i*280}" y="136" width="14" height="14" fill="${color(s.color)}"/><text x="${62+i*280}" y="149" font-size="17" fill="${textColor}">${xml(s.label)}</text>`).join(''):'';
 let body='',height=0;
 if(spec.kind==='monthly'){
  const x0=75,x1=1150,y0=205,y1=560,maximum=Math.max(1,...spec.rows.map(r=>r.values.reduce((a,b)=>a+b,0))),step=Math.max(1,Math.ceil(maximum/4)),ceiling=Math.ceil(maximum/step)*step,slot=(x1-x0)/spec.rows.length;
  for(let n=0;n<=ceiling;n+=step){const y=y1-n/ceiling*(y1-y0);body+=`<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="${axisColor}"/><text x="${x0-16}" y="${y+6}" text-anchor="end" font-size="17" fill="${muted}">${n}</text>`;}
  spec.rows.forEach((row,i)=>{const x=x0+i*slot+slot*.18;let base=y1;row.values.forEach((v,j)=>{const h=v/ceiling*(y1-y0);body+=`<rect x="${x}" y="${base-h}" width="${slot*.64}" height="${h}" fill="${color(spec.series[j].color)}"/>`;base-=h;});const month=Number(row.label.slice(5)),label=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month-1];body+=`<text x="${x+slot*.32}" y="${y1+30}" text-anchor="middle" font-size="15" fill="${muted}">${label}</text>`;});
  for(let year=0;year<2;year++){const begin=x0+year*slot*12+14,end=x0+(year+1)*slot*12-14,y=y1+49;body+=`<path d="M${begin} ${y}H${end}" fill="none" stroke="${muted}" stroke-opacity=".35"/><text x="${(begin+end)/2}" y="${y+29}" text-anchor="middle" font-size="19" font-weight="600" fill="${textColor}">${2025+year}</text>`;}
  body+=`<text x="${x0}" y="180" font-size="16" fill="${muted}">Bills introduced</text>`;height=735;
 }else{
  const rawMaximum=spec.max||Math.max(1,...spec.rows.map(r=>r.values.reduce((a,b)=>a+b,0))),power=10**Math.floor(Math.log10(Math.max(1,rawMaximum/4))),step=rawMaximum<=10?1:([1,2,5,10].find(n=>n*power>=rawMaximum/4)||10)*power,maximum=spec.percentage?100:Math.ceil(rawMaximum/step)*step,ticks=spec.percentage?[0,25,50,75,100]:Array.from({length:Math.round(maximum/step)+1},(_,i)=>i*step);
  const heights=spec.rows.map(r=>Math.max(52,wrap(r.label).length*22+18)),bottom=start+heights.reduce((a,b)=>a+b,0);
  for(const tick of ticks){const x=left+tick/maximum*plotWidth;body+=`<line x1="${x}" x2="${x}" y1="${start-10}" y2="${bottom}" stroke="${axisColor}"/>`;const label=spec.percentage?tick+'%':Number.isInteger(tick)?tick:Number(tick.toFixed(1));body+=`<text x="${x}" y="${bottom+28}" text-anchor="middle" font-size="16" fill="${muted}">${label}</text>`;}
  let y=start;
  spec.rows.forEach((row,i)=>{const rowHeight=heights[i],lines=wrap(row.label),cy=y+rowHeight/2;body+=lines.map((line,j)=>`<text x="40" y="${cy-(lines.length-1)*11+j*22+6}" font-size="18" fill="${textColor}">${xml(line)}</text>`).join('');let x=left;row.values.forEach((value,j)=>{const amount=spec.percentage?(row.denominator?value/row.denominator*100:0):value,w=amount/maximum*plotWidth;body+=`<rect x="${x}" y="${cy-9}" width="${w}" height="18" fill="${color(row.color||spec.series[j].color)}"/>`;x+=w;});body+=`<text x="1160" y="${cy+6}" font-size="17" text-anchor="end" fill="${textColor}">${xml(row.display||row.values.reduce((a,b)=>a+b,0))}</text>`;y+=rowHeight;});
  body+=`<text x="${left+plotWidth/2}" y="${bottom+57}" text-anchor="middle" font-size="17" fill="${muted}">${xml(spec.unit||'Tracked bills')}</text>`;height=bottom+135;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-theme="${dark?'dark':'light'}" role="img" aria-labelledby="title desc"><title id="title">${xml(spec.title)}</title><desc id="desc">${xml(spec.note)} ${xml(spec.scope)}. ${spec.rows.map(r=>xml(r.label)+': '+xml(r.display||r.values.join(', '))).join('; ')}</desc><rect width="100%" height="100%" fill="${background}"/><g font-family="Segoe UI, system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fill="${textColor}"><text x="40" y="40" font-size="18" fill="${muted}">119TH CONGRESS · 2025–2026</text><text x="40" y="84" font-size="30" font-weight="600">${xml(spec.title)}</text><text x="40" y="115" font-size="17" fill="${muted}">${xml(spec.scope)}${spec.note?' · '+xml(spec.note):''}</text>${legend}${body}<line x1="40" x2="1160" y1="${height-52}" y2="${height-52}" stroke="${axisColor}"/><text x="40" y="${height-25}" font-size="15" fill="${muted}">© 2026 Arik Karim · Atlas</text></g></svg>`;
}
export function chartCsv(spec){const protect=v=>/^[=+@\-\t\r]/.test(String(v))?"'"+v:v,quote=v=>'"'+String(protect(v??'')).replace(/"/g,'""')+'"';return [['Category',...spec.series.map(s=>s.label),'Total','Tracked bills in area'],...spec.rows.map(r=>[r.label,...r.values,r.values.reduce((a,b)=>a+b,0),r.denominator??''])].map(row=>row.map(quote).join(',')).join('\r\n');}
export function patternsHash(chamber='',chart=''){const params=new URLSearchParams();if(['House','Senate'].includes(chamber))params.set('chamber',chamber);if(chart&&/^[a-z-]+$/.test(chart))params.set('chart',chart);return '#trends'+(params.size?'?'+params:'');}
export function readPatternsHash(hash){const [view,query='']=hash.replace(/^#/,'').split('?'),params=new URLSearchParams(query);return {view:['trends','patterns','charts'].includes(view)?'charts':'tracker',chamber:['House','Senate'].includes(params.get('chamber'))?params.get('chamber'):'',chart:params.get('chart')||''};}



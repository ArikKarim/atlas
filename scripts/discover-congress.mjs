import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {normalize} from '../public/model.js';
import {congressClient,billIdentity} from './sync-congress.mjs';
import {reviewHtml} from './review-page.mjs';
const project=new URL('../',import.meta.url);
export const scopeRules=[
 ['AI & automation',/\b(?:artificial intelligence|AI|machine learning|deep ?fakes?|generative|chatbots?|automated decision(?:making|[- ]making)?|digital replicas?|neural networks?)\b/i],
 ['Algorithms & platforms',/\b(?:algorithms?|algorithmic|recommender systems?|recommendation systems?|social media|online safety|digital safety)\b/i],
 ['Data centers & compute',/\b(?:data cent(?:er|re)s?|cloud computing|computational (?:resources|infrastructure)|high[- ]performance comput(?:ing|ers)|GPUs?|graphics processing units?|compute infrastructure)\b/i],
 ['Semiconductors & export controls',/\b(?:semiconductors?|microelectronics|chips?|integrated circuits?|export controls?|advanced computing)\b/i],
 ['Energy & grid',/\b(?:electric(?:ity|al)? grid|power grid|grid (?:capacity|reliability|modernization|resilience)|transmission (?:lines?|capacity|infrastructure)|large[- ]load customers?|energy infrastructure)\b/i],
 ['Quantum technology',/\bquantum\b/i],
 ['Privacy & data governance',/\b(?:data privacy|consumer privacy|personal data|data protection|data brokers?|biometric|privacy protections?)\b/i]
];
export function plain(value){return String(value||'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,v=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '}[v])).replace(/\s+/g,' ').trim();}
export function idFor(bill){const type=String(bill?.type).toLowerCase();return Number(bill?.congress)===119&&['hr','s'].includes(type)&&/^[1-9]\d*$/.test(String(bill.number))?(type==='hr'?'H.R.':'S.')+bill.number:null;}
export function matches(text,field){return scopeRules.flatMap(([area,re])=>{const match=re.exec(plain(text));return match?[{area,field,term:match[0],excerpt:plain(text).slice(Math.max(0,match.index-90),match.index+180)}]:[];});}
export function findCandidates(list,summaries,relations,tracked,decisions={}){
 const known=new Set(normalize(tracked).map(b=>b.id)),byId=new Map();
 for(const bill of list){const id=idFor(bill);if(id&&!known.has(id))byId.set(id,{id,title:plain(bill.title),chamber:String(bill.type).toLowerCase()==='hr'?'House':'Senate',evidence:matches(bill.title,'title'),relatedTo:[],summary:'',summaryDate:null});}
 // Keep every available summary version as match evidence, but display the latest one.
 for(const summary of summaries){const row=byId.get(idFor(summary.bill));if(!row)continue;row.evidence.push(...matches(summary.text,'summary').map(e=>({...e,versionDate:summary.updateDate||summary.actionDate||''})));const date=summary.updateDate||summary.actionDate||'';if(!row.summary||date>=(row.summaryDate||'')){row.summary=plain(summary.text);row.summaryDate=date;}}
 for(const relation of relations){const row=byId.get(idFor(relation.bill));if(row)row.relatedTo.push({id:relation.sourceId,relationship:relation.relationship||'Related bill'});}
 return [...byId.values()].filter(b=>b.evidence.length||b.relatedTo.length).map(b=>{
  b.evidence=[...new Map(b.evidence.map(e=>[e.area+'|'+e.field+'|'+e.term.toLowerCase(),e])).values()];
  b.relatedTo=[...new Map(b.relatedTo.map(r=>[r.id+'|'+r.relationship,r])).values()];
  b.areas=[...new Set(b.evidence.map(e=>e.area))];b.reviewGroup=b.evidence.some(e=>e.area==='AI & automation')?'Direct AI reference':b.relatedTo.length?'Related to tracked bill':'Broader policy scope';
  const decision=decisions[b.id]?.title===b.title?decisions[b.id]:null;b.decision=decision?.decision||'pending';b.note=decision?.note||'';return b;
 }).sort((a,b)=>['Direct AI reference','Related to tracked bill','Broader policy scope'].indexOf(a.reviewGroup)-['Direct AI reference','Related to tracked bill','Broader policy scope'].indexOf(b.reviewGroup)||a.id.localeCompare(b.id,'en',{numeric:true}));
}
async function parallel(items,fn,concurrency=3){let index=0;await Promise.all(Array.from({length:concurrency},async()=>{while(index<items.length){const i=index++;await fn(items[i],i);}}));}
export async function discover({apiKey,fetchImpl=fetch,now=new Date().toISOString(),onProgress=console.log}={}){
 const client=congressClient(apiKey,{fetchImpl}),tracked=normalize(JSON.parse(await readFile(new URL('public/bills.json',project),'utf8')));
 let decisions={};try{decisions=JSON.parse(await readFile(new URL('data/candidate-decisions.json',project),'utf8')).records||{};}catch(e){if(e.code!=='ENOENT')throw e;}
 const list=[],summaries=[],relations=[],warnings=[];
 for(const type of ['hr','s']){
  onProgress('Scanning '+type.toUpperCase()+' titles');list.push(...await client.collection('bill/119/'+type,'bills'));
  onProgress('Scanning '+type.toUpperCase()+' summaries');summaries.push(...await client.collection('summaries/119/'+type+'?fromDateTime=2025-01-03T00:00:00Z&sort=updateDate+desc','summaries'));
 }
 let checked=0;
 await parallel(tracked,async source=>{const id=billIdentity(source.id);const related=await client.collection(`bill/119/${id.type}/${id.number}/relatedbills`,'relatedBills',{allowCountMismatch:true,onCountMismatch:counts=>warnings.push({id:source.id,field:'relatedBills',...counts,message:'API supplied fewer related bills than its count, without another page.'})});for(const bill of related)relations.push({sourceId:source.id,bill,relationship:(bill.relationshipDetails||[]).map(r=>r.type).filter(Boolean).join('; ')});if(++checked%40===0)onProgress(`Checked related bills for ${checked}/${tracked.length}`);});
 const candidates=findCandidates(list,summaries,relations,tracked,decisions);checked=0;
 await parallel(candidates,async row=>{
  const id=billIdentity(row.id),path=`bill/119/${id.type}/${id.number}`,data=await client.request(path);if(idFor(data?.bill)!==row.id)throw Error('Candidate identity mismatch: '+row.id);
  const bill=data.bill;row.title=plain(bill.title);row.introduced=bill.introducedDate;row.sponsor=(bill.sponsors||[]).map(p=>p.lastName&&p.party&&p.state?`${p.lastName} (${p.party}-${p.state})`:p.fullName).join('; ');
  row.latestAction={date:bill.latestAction?.actionDate||'',text:plain(bill.latestAction?.text)};row.url=`https://www.congress.gov/bill/119th-congress/${id.type==='hr'?'house':'senate'}-bill/${id.number}`;
  const subjects=await client.request(path+'/subjects');row.subjects=(subjects?.subjects?.legislativeSubjects||[]).map(s=>s.name);row.policyArea=subjects?.subjects?.policyArea?.name||bill.policyArea?.name||'';
  row.evidence.push(...matches(row.subjects.join('; '),'subject'));row.areas=[...new Set(row.evidence.map(e=>e.area))];
  if(++checked%50===0)onProgress(`Verified ${checked}/${candidates.length} candidates`);
 });
 for(const b of candidates){if(b.summary.length>2200)b.summary=b.summary.slice(0,2200).replace(/\s+\S*$/,'')+'…';}
 const report={schemaVersion:1,generatedAt:now,congress:119,coverage:{warnings,billCount:list.length,summaryVersions:summaries.length,trackedBills:tracked.length,relatedBillChecks:tracked.length,fields:['display title','available CRS summary versions','related-bill links'],limitations:'Does not search full bill text or scan subjects on every bill. Subjects are retrieved for discovered candidates. Matches are suggestions for review, not additions or verified SIIA engagement.'},rules:scopeRules.map(([area,re])=>({area,pattern:re.source})),candidateCount:candidates.length,candidates};
 await mkdir(new URL('data/',project),{recursive:true});
 for(const [name,content] of [['congress-candidates.json',JSON.stringify(report,null,2)+'\n'],['candidate-review.html',reviewHtml(report)],['CANDIDATE-REVIEW.md',markdownReport(report)]]){const dest=new URL('data/'+name,project),tmp=new URL(dest.href+'.tmp');await writeFile(tmp,content);await rename(tmp,dest);}
 return report;
}
export function markdownReport(report){const clean=v=>String(v||'').replace(/[|\r\n]/g,' ');return '# Atlas candidate review\n\nGenerated '+report.generatedAt+'. '+report.candidateCount+' candidates; '+report.coverage.trackedBills+' tracked bills remain unchanged.\n\nOpen `candidate-review.html` for filters, evidence, and Include / Exclude / Defer decisions. Export your decisions and import them with `npm run review:candidates -- --import path/to/decisions.json`. Included candidates still require an explicit reviewed change to the Tracker.\n\nCoverage: titles, available summary versions, and related bills. Full bill text is not searched. SIIA engagement is not inferred.\n\n| Bill | Official title | Review group | Match areas | Sponsor | Related tracked bills | Decision |\n|---|---|---|---|---|---|---|\n'+report.candidates.map(b=>`| [${b.id}](${b.url}) | ${clean(b.title)} | ${b.reviewGroup} | ${b.areas.join('; ')} | ${clean(b.sponsor)} | ${b.relatedTo.map(r=>r.id).join(', ')} | ${b.decision} |`).join('\n')+'\n';}
if(process.argv[1]===fileURLToPath(import.meta.url)){try{const r=await discover({apiKey:process.env.CONGRESS_GOV_API_KEY});console.log(JSON.stringify({candidates:r.candidateCount,coverage:r.coverage}));}catch(e){console.error(e.message);process.exitCode=1;}}

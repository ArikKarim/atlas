import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {normalize} from '../public/model.js';
import {applyCongressData} from '../public/congress.js';
import {summarize} from '../public/charts.js';
import {chartSpecs} from '../public/chart-export.js';
import {companionStats} from '../public/companions.js';

export async function auditTrends(){
 const json=async name=>JSON.parse(await readFile(new URL('../'+name,import.meta.url),'utf8'));
 const raw=await json('public/bills.json'),snapshot=await json('public/congress-data.json'),plan=await json('data/companion-additions.json');
 const bills=applyCongressData(normalize(raw),snapshot),added=new Set(plan.additions.map(b=>b.id)),original=bills.filter(b=>!added.has(b.id)),companions=companionStats(bills);
 const scopes=Object.fromEntries(['','House','Senate'].map(chamber=>{
  const summary=summarize(bills,chamber),previous=new Map(chartSpecs(original,chamber).map(s=>[s.id,s]));
  return [chamber||'All chambers',{billCount:summary.rows.length,monthlyTotal:summary.months.reduce((n,m)=>n+m.total,0),focusAreaTotal:summary.topics.reduce((n,t)=>n+t.total,0),engagement:summary.engagement,cosponsorBandTotal:summary.cosponsorBands.reduce((n,b)=>n+b.total,0),charts:chartSpecs(bills,chamber).map(spec=>({id:spec.id,title:spec.title,updatedByCompanions:JSON.stringify(spec.rows)!==JSON.stringify(previous.get(spec.id)?.rows),rows:spec.rows}))}];
 }));
 return {checkedAt:new Date().toISOString(),officialSnapshotCheckedAt:snapshot.checkedAt,billCount:bills.length,originalBillCount:original.length,addedCompanions:plan.additions.length,missingAdditions:[...added].filter(id=>!bills.some(b=>b.id===id)),coverage:companions.coverage,companionFamilies:companions.families.length,introductionGaps:companions.bands.map(({label,count})=>({label,count})),scopes};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const report=await auditTrends();
 if(process.argv.includes('--write'))await writeFile(new URL('../data/trends-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({bills:report.billCount,companionsAdded:report.addedCompanions,missing:report.missingAdditions,coverage:report.coverage,families:report.companionFamilies,scopes:Object.fromEntries(Object.entries(report.scopes).map(([key,s])=>[key,{bills:s.billCount,monthly:s.monthlyTotal,focusAreas:s.focusAreaTotal,engagement:s.engagement,charts:s.charts.map(c=>({id:c.id,changed:c.updatedByCompanions}))}]))},null,2));
}

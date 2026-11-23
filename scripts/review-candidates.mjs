import {fileURLToPath} from 'node:url';
import {readFile,writeFile} from 'node:fs/promises';
import {reviewHtml} from './review-page.mjs';
import {markdownReport} from './discover-congress.mjs';
const root=new URL('../data/',import.meta.url),read=async p=>JSON.parse(await readFile(p,'utf8'));
export function validateDecisions(input,report){
 if(input.schemaVersion!==1||input.congress!==119||!input.records||typeof input.records!=='object'||Array.isArray(input.records))throw Error('Expected Atlas 119th Congress review decisions');
 const known=new Map(report.candidates.map(b=>[b.id,b])),records={};
 for(const [id,d] of Object.entries(input.records)){const b=known.get(id);if(!b)throw Error('Unknown candidate: '+id);if(d.title!==b.title)throw Error('Official title changed; review again: '+id);if(!['include','exclude','defer','pending'].includes(d.decision)||typeof d.note!=='string'||d.note.length>10000)throw Error('Invalid decision for '+id);records[id]={title:b.title,decision:d.decision,note:d.note,reviewedAt:d.reviewedAt||new Date().toISOString()};}return records;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{const report=await read(new URL('congress-candidates.json',root)),index=process.argv.indexOf('--import');let records={};try{records=(await read(new URL('candidate-decisions.json',root))).records||{};}catch(e){if(e.code!=='ENOENT')throw e;}
 if(index>=0){if(!process.argv[index+1])throw Error('Supply a decisions JSON file');records={...records,...validateDecisions(await read(process.argv[index+1]),report)};await writeFile(new URL('candidate-decisions.json',root),JSON.stringify({schemaVersion:1,congress:119,records},null,2)+'\n');}
 for(const b of report.candidates){b.decision=records[b.id]?.decision||'pending';b.note=records[b.id]?.note||'';}
 await writeFile(new URL('candidate-review.html',root),reviewHtml(report));await writeFile(new URL('CANDIDATE-REVIEW.md',root),markdownReport(report));console.log('Open data/candidate-review.html. Decisions do not modify the published Tracker.');
 }catch(e){console.error(e.message);process.exitCode=1;}
}

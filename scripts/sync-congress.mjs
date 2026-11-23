import {normalize} from '../public/model.js';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const project=new URL('../',import.meta.url),apiRoot='https://api.congress.gov/v3/';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function billIdentity(id){const m=/^(H\.R\.|S\.)([1-9]\d*)$/.exec(id);if(!m)throw Error('Unsupported bill identifier');return {congress:119,type:m[1]==='H.R.'?'hr':'s',number:Number(m[2])};}
export function normalizedTitle(title){return String(title).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(?:the|of|20\d{2})\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');}
export function identityMatches(source,bill,titles=[],identities={}){
 const id=billIdentity(source.id),expected=normalizedTitle(source.title),knownTitles=[bill.title,...titles.map(t=>t.title)],approved=identities[source.id];
 const reviewed=approved?.sourceTitle===source.title&&approved.congress===id.congress&&approved.type===id.type&&approved.number===id.number&&knownTitles.some(title=>normalizedTitle(title)===normalizedTitle(approved.officialTitle));
 return Number(bill.congress)===id.congress&&String(bill.type).toLowerCase()===id.type&&Number(bill.number)===id.number&&expected.length>5&&(knownTitles.some(title=>normalizedTitle(title)===expected)||reviewed===true);
}
function plainText(html){return String(html||'').replace(/<\/(?:p|li|div)>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(match,n)=>{const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return code>0&&code<=0x10ffff?String.fromCodePoint(code):match;}).replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '}[x])).replace(/\n\s*\n/g,'\n\n').trim();}
function person(p){return p.lastName&&p.party&&p.state?`${p.lastName} (${p.party}-${p.state})`:String(p.fullName||'');}
export function officialRecord(source,bill,cosponsors,summaries,now){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(bill.introducedDate||''))throw Error('Invalid official introduction date');
 const active=cosponsors.filter(p=>!p.sponsorshipWithdrawnDate),count=Number(bill.cosponsors?.count??active.length);
 if(!Number.isInteger(count)||count<0||active.length!==count)throw Error('Incomplete cosponsor response');
 const summary=[...summaries].sort((a,b)=>String(b.updateDate||b.actionDate||'').localeCompare(String(a.updateDate||a.actionDate||'')))[0];
 return {id:source.id,status:'verified',sourceTitle:source.title,officialTitle:bill.title,introduced:bill.introducedDate,
  sponsor:(bill.sponsors||[]).map(person).filter(Boolean).join('; '),cosponsors:active.map(person).filter(Boolean).join('; '),cosponsorCount:count,
  action:bill.latestAction?.text?`${bill.latestAction.text}${bill.latestAction.actionDate?' ('+bill.latestAction.actionDate+')':''}`:'',
  latestActionDate:bill.latestAction?.actionDate||null,officialSummary:plainText(summary?.text),summaryDate:summary?.updateDate||summary?.actionDate||null,
  congressUpdatedAt:bill.updateDateIncludingText||bill.updateDate||null,verifiedAt:now};
}
export function congressClient(apiKey,{fetchImpl=fetch,sleep=pause}={}){
 if(!apiKey)throw Error('Add the CONGRESS_GOV_API_KEY repository secret before running this sync.');
 async function request(path){
  const url=new URL(path,apiRoot);
  if(url.origin!=='https://api.congress.gov'||!/^\/v3\/(?:bill|summaries)\/119(?:\/|$)/.test(url.pathname))throw Error('Unexpected API destination');
  url.searchParams.delete('api_key');url.searchParams.set('format','json');url.searchParams.set('limit','250');
  for(let attempt=0;attempt<3;attempt++){
   let response;try{response=await fetchImpl(url,{headers:{'X-Api-Key':apiKey,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});}catch{if(attempt<2){await sleep(1000*(attempt+1));continue;}throw Error('Congress.gov request could not be completed');}
   if(response.status===401||response.status===403)throw Object.assign(Error('Congress.gov rejected the API key. Check the repository secret and key verification.'),{fatal:true});
   if(response.status===429)throw Object.assign(Error('Congress.gov rate limit reached; retry the sync later.'),{fatal:true});
   if(response.status===404)return null;
   if(response.status>=500&&attempt<2){await sleep(1000*(attempt+1));continue;}
   if(!response.ok)throw Error(`Congress.gov returned HTTP ${response.status}`);
   try{return await response.json();}catch{throw Error('Congress.gov returned an invalid response');}
  }
 }
 async function collection(path,field,{allowCountMismatch=false,onCountMismatch=()=>{}}={}){let next=path,all=[],seen=new Set();for(let page=0;next&&page<200;page++){
  const key=String(next);if(seen.has(key))throw Error('Repeated API pagination link');seen.add(key);
  const data=await request(next);if(!data||!Array.isArray(data[field]))throw Error(`Missing ${field} response`);
  all.push(...data[field]);next=data.pagination?.next||null;
  if(!next&&Number.isFinite(data.pagination?.count)&&all.length<data.pagination.count){if(allowCountMismatch)onCountMismatch({expected:data.pagination.count,received:all.length});else throw Error(`Incomplete ${field} pagination`);}
 }if(next)throw Error('API pagination limit exceeded');return all;}
 return {request,collection};
}
export async function buildSnapshot(rows,{apiKey,previous={records:{}},identities={},fetchImpl=fetch,sleep=pause,now=new Date().toISOString(),onProgress=()=>{}}={}){
 const client=congressClient(apiKey,{fetchImpl,sleep}),unique=normalize(rows),records={},review=[];
 for(const [index,source] of unique.entries()){
  try{
   const identity=billIdentity(source.id),path=`bill/119/${identity.type}/${identity.number}`,response=await client.request(path);
   if(!response?.bill){review.push({id:source.id,status:'not-found',sourceTitle:source.title});continue;}
   const bill=response.bill,titles=normalizedTitle(bill.title)===normalizedTitle(source.title)?[]:await client.collection(path+'/titles','titles');
   if(!identityMatches(source,bill,titles,identities)){review.push({id:source.id,status:'identity-review',sourceTitle:source.title,congressTitle:bill.title});continue;}
   const cosponsors=await client.collection(path+'/cosponsors','cosponsors'),summaries=await client.collection(path+'/summaries','summaries');
   records[source.id]=officialRecord(source,bill,cosponsors,summaries,now);
  }catch(error){
   if(error.fatal)throw error;
   const old=previous.records?.[source.id];if(old?.status==='verified'&&old.sourceTitle===source.title)records[source.id]=old;
   review.push({id:source.id,status:'request-error',message:error.message});
  }finally{onProgress({processed:index+1,total:unique.length,verified:Object.keys(records).length});}
 }
 const refreshed=Object.values(records).filter(r=>r.verifiedAt===now).length;
 if(!refreshed)throw Error('No tracked bills were verified. Existing snapshot was not changed; inspect bill identifiers and API access.');
 return {snapshot:{schemaVersion:1,checkedAt:now,source:'Congress.gov',trackedCount:unique.length,verifiedCount:Object.keys(records).length,refreshedCount:refreshed,reviewCount:review.length,records},report:{checkedAt:now,verifiedCount:Object.keys(records).length,refreshedCount:refreshed,review}};
}
async function atomicJson(url,data){const tmp=new URL(url.href+'.tmp');await writeFile(tmp,JSON.stringify(data,null,2)+'\n');await rename(tmp,url);}
export async function syncCongress(options={}){
 const rows=JSON.parse(await readFile(new URL('public/bills.json',project),'utf8'));
 let previous;try{previous=JSON.parse(await readFile(new URL('public/congress-data.json',project),'utf8'));}catch{previous={records:{}};}
 let identities={};try{identities=JSON.parse(await readFile(new URL('data/congress-identities.json',project),'utf8')).records||{};}catch(error){if(error.code!=='ENOENT')throw Error('Invalid Congress.gov identity review file');}
 const result=await buildSnapshot(rows,{...options,previous,identities});
 await mkdir(new URL('data/',project),{recursive:true});
 await atomicJson(new URL('data/congress-sync-report.json',project),result.report);
 await atomicJson(new URL('public/congress-data.json',project),result.snapshot);
 return {tracked:result.snapshot.trackedCount,verified:result.snapshot.verifiedCount,refreshed:result.snapshot.refreshedCount,review:result.snapshot.reviewCount};
}
async function stdinKey(){
 if(process.stdin.isTTY)process.stdin.setRawMode(true);
 return new Promise((resolve,reject)=>{let value='';process.stdin.setEncoding('utf8');process.stdin.resume();process.stdin.on('data',chunk=>{
  if(chunk.includes('\u0003')){process.stdin.pause();reject(Error('Sync cancelled'));return;}
  value+=chunk;if(/[\r\n]/.test(value)){if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();resolve(value.trim());}
 });});
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{const apiKey=process.argv.includes('--key-stdin')?await stdinKey():process.env.CONGRESS_GOV_API_KEY;
  const result=await syncCongress({apiKey,onProgress:p=>{if(p.processed%20===0)console.log(`Checked ${p.processed}/${p.total} bills; ${p.verified} verified`);}});console.log(JSON.stringify(result));
 }catch(error){console.error(error.message);process.exitCode=1;}
}

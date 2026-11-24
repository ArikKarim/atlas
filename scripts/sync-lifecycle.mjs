import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {congressClient,billIdentity} from './sync-congress.mjs';
import {normalize} from '../public/model.js';
import {legislativeStage} from '../public/explore.js';
const root=new URL('../',import.meta.url);
export async function syncLifecycle(apiKey){
 const bills=normalize(JSON.parse(await readFile(new URL('public/bills.json',root)))),snapshot=JSON.parse(await readFile(new URL('public/congress-data.json',root))),client=congressClient(apiKey),records={},errors=[];let next=0;
 const checkedAt=new Date().toISOString();
 await Promise.all(Array.from({length:3},async()=>{while(next<bills.length){const bill=bills[next++];try{const id=billIdentity(bill.id),actions=await client.collection(`bill/119/${id.type}/${id.number}/actions`,'actions');const clean=actions.map(a=>({date:a.actionDate,text:a.text,type:a.type||'',code:a.actionCode||'',source:a.sourceSystem?.name||''})).sort((a,b)=>a.date.localeCompare(b.date));records[bill.id]={id:bill.id,stage:legislativeStage(clean),checkedAt,latestActionDate:clean.at(-1)?.date||snapshot.records[bill.id]?.latestActionDate||bill.introduced,actions:clean};}catch(error){errors.push({id:bill.id,message:error.message});}}}));
 if(errors.length)throw Error('Action history refresh incomplete for '+errors.map(e=>e.id).join(', '));
 await writeFile(new URL('public/lifecycle.json',root),JSON.stringify({schemaVersion:1,checkedAt,trackedCount:bills.length,records},null,2)+'\n');console.log(JSON.stringify({histories:Object.keys(records).length,stages:Object.values(records).reduce((all,r)=>(all[r.stage]=(all[r.stage]||0)+1,all),{})}));
}
if(process.argv[1]===fileURLToPath(import.meta.url)){try{await syncLifecycle(process.env.CONGRESS_GOV_API_KEY)}catch(error){console.error(error.message);process.exitCode=1}}

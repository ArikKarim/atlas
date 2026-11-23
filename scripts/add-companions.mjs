import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {normalize} from '../public/model.js';
import {billIdentity,buildSnapshot,congressClient,normalizedTitle} from './sync-congress.mjs';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
export function companionRelationship(a,b,relationship){return a.chamber!==b.chamber&&(relationship==='Identical bill'||normalizedTitle(a.title)===normalizedTitle(b.title));}
export async function addCompanions(apiKey){
 const plan=await read('data/companion-additions.json'),raw=await read('public/bills.json'),previous=await read('public/congress-data.json'),known=new Set(normalize(raw).map(b=>b.id));
 const additions=plan.additions.filter(b=>!known.has(b.id)),drafts=additions.map(b=>({id:b.id,title:b.title}));
 let refreshed={records:{}};if(drafts.length){const result=await buildSnapshot(drafts,{apiKey});if(result.snapshot.reviewCount||result.snapshot.verifiedCount!==drafts.length)throw Error('A companion record needs review; no additions saved');refreshed=result.snapshot;}
 const merged={...previous.records,...refreshed.records};
 for(const b of additions){const r=merged[b.id];if(!r?.officialTitle||!r.sponsor||!r.introduced||!b.summary||!b.primary)throw Error('Incomplete companion '+b.id);raw.push({id:b.id,title:b.title,chamber:b.id.startsWith('H.R.')?'House':'Senate',primary:b.primary,secondary:b.secondary||'',sponsor:r.sponsor,cosponsors:r.cosponsors,cosponsorCount:String(r.cosponsorCount),introduced:r.introduced,action:r.action,summary:b.summary,engagement:b.engagement||'',...(b.engagementUrl?{engagementMaterial:b.engagementUrl}:{}),url:`https://www.congress.gov/bill/119th-congress/${b.id.startsWith('H.R.')?'house':'senate'}-bill/${billIdentity(b.id).number}`});}
 const bills=normalize(raw).map(b=>({...b,title:merged[b.id]?.officialTitle||b.title})),byId=new Map(bills.map(b=>[b.id,b])),links=new Map(),warnings=[],client=congressClient(apiKey);let next=0;
 const connect=(a,b,relationship)=>{const pair=[a.id,b.id].sort();links.set(pair.join('|'),{ids:pair,relationship});};
 await Promise.all(Array.from({length:3},async()=>{while(next<bills.length){const b=bills[next++],id=billIdentity(b.id),related=await client.collection(`bill/119/${id.type}/${id.number}/relatedbills`,'relatedBills',{allowCountMismatch:true,onCountMismatch:counts=>warnings.push({id:b.id,...counts})});
  for(const item of related){if(Number(item.congress)!==119)continue;const other=byId.get((String(item.type).toLowerCase()==='hr'?'H.R.':String(item.type).toLowerCase()==='s'?'S.':'?')+item.number);if(!other)continue;const types=(item.relationshipDetails||[]).map(r=>r.type);const relationship=types.includes('Identical bill')?'Identical bill':types.join('; ')||'Related bill';if(companionRelationship(b,other,relationship))connect(b,other,relationship);}
 }}));
 for(const addition of plan.additions){const b=byId.get(addition.id);if(!b)continue;for(const c of addition.counterparts){const other=byId.get(c.id);if(!other||!companionRelationship(b,other,c.relationship))throw Error('Invalid reviewed counterpart '+b.id);connect(b,other,c.relationship);}}
 for(const row of raw){const id=row.id.trim();row.companions=[...links.values()].filter(p=>p.ids.includes(id)).map(p=>({id:p.ids.find(x=>x!==id),relationship:p.relationship}));}
 const now=new Date().toISOString(),snapshot={...previous,checkedAt:now,trackedCount:bills.length,verifiedCount:Object.keys(merged).length,refreshedCount:drafts.length,reviewCount:0,records:merged};
 await writeFile(new URL('public/bills.json',root),JSON.stringify(raw,null,2)+'\n');await writeFile(new URL('public/congress-data.json',root),JSON.stringify(snapshot,null,2)+'\n');await writeFile(new URL('data/companion-audit.json',root),JSON.stringify({checkedAt:now,added:plan.additions.map(b=>b.id),links:[...links.values()],warnings},null,2)+'\n');console.log(JSON.stringify({added:additions.length,tracked:bills.length,companionPairs:links.size}));
}
if(process.argv[1]===fileURLToPath(import.meta.url)){try{await addCompanions(process.env.CONGRESS_GOV_API_KEY);}catch(e){console.error(e.message);process.exitCode=1;}}

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalize,filterBills} from '../public/model.js';
import {summarize} from '../public/charts.js';
const read=async name=>JSON.parse(await readFile(new URL('../'+name,import.meta.url),'utf8'));

test('every bill has a reviewed, defined focus area and no placeholder or duplicate tags',async()=>{
 const raw=await read('public/bills.json'),bills=normalize(raw),review=await read('data/focus-area-review.json'),byId=new Map(review.records.map(b=>[b.id,b]));
 assert.equal(byId.size,bills.length);assert.equal(review.billCount,bills.length);
 for(const b of raw){assert.ok(review.definitions[b.primary],b.id+' primary');assert.ok(!b.secondary||review.definitions[b.secondary],b.id+' secondary');assert.notEqual(b.primary,b.secondary);const checked=byId.get(b.id.trim());assert.equal(b.primary,checked.primary);assert.equal(b.secondary,checked.secondary);assert.ok(checked.sources.length);}
 assert.equal(bills.find(b=>b.id==='H.R.3633').primary,'Digital Assets & Financial Regulation');
 assert.deepEqual(filterBills(bills,{topic:'Telecommunications & Connectivity'}).map(b=>b.id).sort(),['H.R.9151','S.5333']);
 assert.equal(summarize(bills).topics.reduce((n,t)=>n+t.total,0),bills.length);
});

test('reviewed companion pairs and import plans retain consistent focus assignments',async()=>{
 const bills=normalize(await read('public/bills.json')),byId=new Map(bills.map(b=>[b.id,b])),plan=await read('data/companion-additions.json');
 for(const b of bills)for(const companion of b.companions||[]){const other=byId.get(companion.id);if(!other)continue;assert.equal(b.primary,other.primary,b.id+' / '+other.id);assert.equal(b.secondary,other.secondary,b.id+' / '+other.id);}
 for(const entry of plan.additions){const b=byId.get(entry.id);assert.equal(b.primary,entry.primary);assert.equal(b.secondary,entry.secondary||'');}
});


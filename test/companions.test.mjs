import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {companionStats} from '../public/companions.js';
import {companionRelationship} from '../scripts/add-companions.mjs';
const bill=(id,chamber,introduced,companions=[])=>({id,chamber,introduced,companions:companions.map(id=>({id}))});
test('companion coverage counts bills once and introduction gaps count each family once',()=>{
 const rows=[bill('H.R.1','House','2025-01-05',['S.1']),bill('S.1','Senate','2025-01-03',['H.R.1','H.R.2']),bill('H.R.2','House','2025-03-01',['S.1']),bill('H.R.3','House','2025-04-01'),bill('S.2','Senate','2025-04-01',['S.99'])];
 const s=companionStats(rows);assert.equal(s.families.length,1);assert.equal(s.families[0].gap,2);assert.deepEqual(s.families[0].ids,['H.R.1','H.R.2','S.1']);assert.equal(s.coverage[0].total,3);assert.equal(s.coverage[1].total,2);assert.equal(s.bands.reduce((n,b)=>n+b.count,0),1);assert.equal(companionStats(rows,'House').coverage[0].total,2);assert.equal(companionStats(rows,'Senate').coverage[0].total,1);
});
test('related proposals with different titles are excluded from companion import',()=>{
 assert.equal(companionRelationship({chamber:'House',title:'Different Act'},{chamber:'Senate',title:'Other Act'},'Related bill'),false);
 assert.ok(companionRelationship({chamber:'House',title:'Same Act of 2025'},{chamber:'Senate',title:'Same Act'},'Related bill'));
 assert.equal(companionRelationship({chamber:'House',title:'Same Act'},{chamber:'House',title:'Same Act'},'Identical bill'),false);
});
test('reviewed additions only contain the 32 approved cross-chamber companions',async()=>{
 const plan=JSON.parse(await readFile(new URL('../data/companion-additions.json',import.meta.url),'utf8'));assert.equal(plan.additions.length,32);assert.equal(new Set(plan.additions.map(b=>b.id)).size,32);
 assert.ok(!plan.additions.some(b=>['H.R.7493','S.4351','H.R.9363','H.R.7158'].includes(b.id)));
 for(const b of plan.additions){assert.ok(b.summary&&b.primary);assert.ok(b.counterparts.length);for(const c of b.counterparts)assert.notEqual(b.id.startsWith('H.R.'),c.id.startsWith('H.R.'));if(b.engagement)assert.match(b.engagementUrl,/^https:\/\/(www\.siia\.net|lda\.gov)\//);}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {findCandidates,matches,idFor} from '../scripts/discover-congress.mjs';
import {reviewHtml} from '../scripts/review-page.mjs';
import {validateDecisions} from '../scripts/review-candidates.mjs';
import {congressClient} from '../scripts/sync-congress.mjs';
const bill=(number,title,type='HR',congress=119)=>({number,title,type,congress});
test('discovery records inconsistent related-bill counts without weakening official fact checks',async()=>{
 const client=congressClient('test-only',{fetchImpl:async()=>({ok:true,status:200,json:async()=>({relatedBills:[bill(2,'Companion')],pagination:{count:2}})})}),warnings=[];
 await assert.rejects(client.collection('bill/119/hr/1/relatedbills','relatedBills'),/Incomplete/);
 const rows=await client.collection('bill/119/hr/1/relatedbills','relatedBills',{allowCountMismatch:true,onCountMismatch:x=>warnings.push(x)});assert.equal(rows.length,1);assert.deepEqual(warnings,[{expected:2,received:1}]);
});
test('discovery includes broad infrastructure, algorithms, and missing companions without adding tracked or wrong-Congress bills',()=>{
 const tracked=[{id:'H.R.1',title:'AI Act'}],list=[bill(1,'AI Act'),bill(2,'Data Center Energy Act'),bill(3,'Semiconductor Supply Act'),bill(4,'Algorithmic Accountability Act'),bill(5,'Unrelated title','S'),bill(6,'AI Act','HR',118),bill(7,'AI Resolution','HRES'),bill(8,'Acronym Act'),bill(9,'Ordinary Act')];
 const summaries=[{bill:bill(8,'Acronym Act'),text:'<p>Requires safeguards for machine learning.</p>',updateDate:'2026-01-01'},{bill:bill(8,'Acronym Act'),text:'<p>Updated artificial intelligence safeguards.</p>',updateDate:'2026-02-01'}];
 const results=findCandidates(list,summaries,[{sourceId:'H.R.1',bill:bill(5,'Unrelated title','S'),relationship:'Identical bill'}],tracked);
 assert.deepEqual(new Set(results.map(b=>b.id)),new Set(['H.R.2','H.R.3','H.R.4','S.5','H.R.8']));assert.equal(results.find(b=>b.id==='S.5').relatedTo[0].id,'H.R.1');assert.equal(results.find(b=>b.id==='H.R.8').summary,'Updated artificial intelligence safeguards.');assert.equal(tracked.length,1);
 for(const term of ['data centres','semiconductor','algorithm','transmission lines','quantum','consumer privacy'])assert.ok(matches(term,'title').length,term);assert.equal(matches('Chairman said the railway opened.','title').length,0);assert.equal(idFor(bill(1,'AI','S',118)),null);
});
test('review decisions are validated against the exact candidate and cannot publish or claim engagement',()=>{
 const report={candidates:[{id:'S.5',title:'Candidate Act'}]},record={title:'Candidate Act',decision:'include',note:'Within scope'};
 const valid=validateDecisions({schemaVersion:1,congress:119,records:{'S.5':record}},report);assert.equal(valid['S.5'].decision,'include');assert.equal(valid['S.5'].engagement,undefined);
 for(const bad of [{...record,title:'Other Act'},{...record,decision:'publish'},{...record,note:5}])assert.throws(()=>validateDecisions({schemaVersion:1,congress:119,records:{'S.5':bad}},report));
 assert.throws(()=>validateDecisions({schemaVersion:1,congress:119,records:{'S.99':record}},report));
});
test('standalone review page safely embeds official text and generates valid browser JavaScript',()=>{
 const html=reviewHtml({candidateCount:1,generatedAt:'2026-11-22T12:00:00Z',coverage:{billCount:5,trackedBills:1},candidates:[{id:'S.1',title:'</script><script>bad()</script>',subjects:[],areas:[],evidence:[],relatedTo:[],latestAction:{text:''},decision:'pending'}]});
 assert.ok(!html.includes('</script><script>bad()'));const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];assert.doesNotThrow(()=>new Script(code));assert.ok(html.includes('Export decisions'));assert.ok(html.includes('Include')||html.includes("'include'"));
});

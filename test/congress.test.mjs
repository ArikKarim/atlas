import test from 'node:test';
import assert from 'node:assert/strict';
import {applyCongressData} from '../public/congress.js';
import {billIdentity,identityMatches,officialRecord,congressClient,buildSnapshot} from '../scripts/sync-congress.mjs';
const source={id:'H.R.10',title:'Example AI Act of 2026',introduced:'2026-01-01',sponsor:'Old (D-NY)',cosponsors:'Old list',cosponsorCount:'2',action:'Old action',primary:'Education',secondary:'AI',engagement:'Endorsed.',summary:'My analysis'};
const official={congress:119,type:'HR',number:10,title:'Example AI Act',introducedDate:'2026-02-01',sponsors:[{lastName:'New',party:'R',state:'CA'}],cosponsors:{count:0},latestAction:{actionDate:'2026-03-01',text:'Referred to committee.'}};
const now='2026-11-22T12:00:00.000Z';
const response=data=>({ok:true,status:200,json:async()=>data});
test('official identity requires matching congress, type, number, and a known title',()=>{
 assert.deepEqual(billIdentity('H.R.10'),{congress:119,type:'hr',number:10});
 assert.ok(identityMatches(source,official));
 assert.ok(identityMatches(source,{...official,title:'Long official description'},[{title:source.title}]));
 for(const wrong of [{...official,number:11},{...official,congress:118},{...official,type:'S'},{...official,title:'Unrelated Act'}])assert.equal(identityMatches(source,wrong),false);
 assert.throws(()=>billIdentity('../secrets'));
});
test('overlay updates facts and preserves all curated research, including zero cosponsors',()=>{
 const record=officialRecord(source,official,[],[{text:'<p>A &amp; B</p>',updateDate:now}],now);
 const [merged]=applyCongressData([source],{schemaVersion:1,records:{[source.id]:{...record,primary:'Incorrect',engagement:'Incorrect',summary:'Incorrect'}}});
 for(const field of ['primary','secondary','engagement','summary','title'])assert.equal(merged[field],source[field]);
 assert.equal(merged.cosponsorCount,'0');assert.equal(merged.cosponsors,'');assert.equal(merged.sponsor,'New (R-CA)');assert.equal(merged.introduced,'2026-02-01');assert.equal(record.officialSummary,'A & B');
 assert.equal(applyCongressData([source],{schemaVersion:1,records:{[source.id]:{...record,sourceTitle:'Different bill'}}})[0],source);
 assert.equal(applyCongressData([source],null)[0],source);
});
test('current cosponsor counts exclude withdrawn sponsors and reject incomplete responses',()=>{
 const people=[{lastName:'One',party:'D',state:'VA'},{lastName:'Two',party:'R',state:'TX',sponsorshipWithdrawnDate:'2026-03-02'}];
 const record=officialRecord(source,{...official,cosponsors:{count:1}},people,[],now);
 assert.equal(record.cosponsorCount,1);assert.equal(record.cosponsors,'One (D-VA)');
 assert.throws(()=>officialRecord(source,{...official,cosponsors:{count:2}},people,[],now),/Incomplete/);assert.equal(officialRecord(source,{...official,cosponsors:undefined},[],[],now).cosponsorCount,0);
});
test('client keeps credentials in headers and validates paginated destinations',async()=>{
 let calls=0;const client=congressClient('test-only-key',{fetchImpl:async(url,options)=>{
  assert.ok(!url.href.includes('test-only-key'));assert.equal(options.headers['X-Api-Key'],'test-only-key');calls++;
  return response({cosponsors:[{name:String(calls)}],pagination:{count:2,...(calls===1?{next:'https://api.congress.gov/v3/bill/119/hr/10/cosponsors?offset=1'}:{})}});
 }});
 assert.equal((await client.collection('bill/119/hr/10/cosponsors','cosponsors')).length,2);
 const unsafe=congressClient('test-only-key',{fetchImpl:async()=>response({titles:[],pagination:{next:'https://example.com/stolen'}})});
 await assert.rejects(unsafe.collection('bill/119/hr/10/titles','titles'),/Unexpected API destination/);
 const rejected=congressClient('test-only-key',{fetchImpl:async()=>({ok:false,status:403})});
 await assert.rejects(rejected.request('bill/119/hr/10'),error=>error.fatal&&!error.message.includes('test-only-key'));
});
test('sync deduplicates normalized records and separates mismatched bills for review',async()=>{
 const other={...source,id:'S.11',title:'Different AI Act'};
 const fetchImpl=async url=>{const path=url.pathname;if(path.endsWith('/titles'))return response({titles:[]});if(path.endsWith('/cosponsors'))return response({cosponsors:[]});if(path.endsWith('/summaries'))return response({summaries:[]});return response({bill:path.includes('/s/')?{...official,type:'S',number:11,title:'Unrelated policy'}:official});};
 const {snapshot,report}=await buildSnapshot([source,{...source,id:' H.R.10 '},other],{apiKey:'test-only-key',fetchImpl,now});
 assert.equal(snapshot.trackedCount,2);assert.equal(snapshot.verifiedCount,1);assert.equal(snapshot.refreshedCount,1);assert.equal(report.review[0].status,'identity-review');assert.ok(!snapshot.records['S.11']);
});
test('failed refreshes retain previous verified facts without advancing their verification date',async()=>{
 const previousRecord=officialRecord(source,official,[],[],now),future='2026-11-23T12:00:00.000Z';
 const second={...source,id:'H.R.12'};
 const fetchImpl=async url=>{if(url.pathname.includes('/10'))throw Error('Secret transport details');if(url.pathname.endsWith('/cosponsors'))return response({cosponsors:[]});if(url.pathname.endsWith('/summaries'))return response({summaries:[]});return response({bill:{...official,number:12}});};
 const {snapshot,report}=await buildSnapshot([source,second],{apiKey:'test-only-key',previous:{records:{[source.id]:previousRecord}},fetchImpl,sleep:async()=>{},now:future});
 assert.equal(snapshot.records[source.id].verifiedAt,now);assert.equal(snapshot.refreshedCount,1);assert.equal(report.review[0].message,'Congress.gov request could not be completed');
 await assert.rejects(buildSnapshot([source],{apiKey:'test-only-key',fetchImpl:async()=>({status:404}),now:future}),/Existing snapshot was not changed/);
});

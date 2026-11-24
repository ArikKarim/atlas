import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {legislativeStage,decorateBills,trackerHash,routeState,matchingBills,sortedBills,familyMatches} from '../public/explore.js';
import {normalize} from '../public/model.js';
import {applyCongressData} from '../public/congress.js';
import {recordOfficialChanges} from '../scripts/official-history.mjs';
import {companionStats} from '../public/companions.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));

test('legislative stages recognize actual passage and do not treat motions as passage',()=>{
 assert.equal(legislativeStage([{type:'IntroReferral',text:'Referred to the committee.'}]),'Introduced');
 assert.equal(legislativeStage([{text:'Mr. Smith moved to suspend the rules and pass the bill.'}]),'Introduced');
 assert.equal(legislativeStage([{type:'Committee',text:'Ordered to be reported.'}]),'Committee action');
 assert.equal(legislativeStage([{text:'Passed/agreed to in House: On motion to suspend the rules and pass the bill Agreed to by voice vote.'}]),'Passed House');
 assert.equal(legislativeStage([{text:'Passed Senate with an amendment.'},{text:'Passed/agreed to in House: Passed.'}]),'Passed both chambers');
 assert.equal(legislativeStage([{type:'BecameLaw',text:'Became Public Law 119-12.'}]),'Enacted');
});

test('all 202 bills have complete action histories and companions keep their individual stages',async()=>{
 const raw=normalize(await read('public/bills.json')),snapshot=await read('public/congress-data.json'),lifecycle=await read('public/lifecycle.json'),bills=decorateBills(applyCongressData(raw,snapshot),lifecycle);
 assert.equal(Object.keys(lifecycle.records).length,202);
 for(const bill of bills){assert.ok(bill.actionHistory.length,bill.id);assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(bill.lastActionDate),bill.id);}
 assert.equal(bills.find(b=>b.id==='S.146').stage,'Enacted');assert.notEqual(bills.find(b=>b.id==='H.R.633').stage,'Enacted');assert.equal(bills.find(b=>b.id==='H.R.1736').stage,'Passed House');
 const families=companionStats(bills).families;assert.equal(families.length,42);
 assert.equal(matchingBills(bills,{status:'Enacted'}).length,1);
});

test('displayed passage and enactment stages agree with official milestone action codes',async()=>{
 const lifecycle=await read('public/lifecycle.json'),bills=decorateBills(applyCongressData(normalize(await read('public/bills.json')),await read('public/congress-data.json')),lifecycle);
 for(const bill of bills){const actions=lifecycle.records[bill.id].actions,house=actions.some(a=>a.code==='8000'),senate=actions.some(a=>a.code==='17000'),enacted=actions.some(a=>a.type==='BecameLaw');const expected=enacted?'Enacted':house&&senate?'Passed both chambers':house?'Passed House':senate?'Passed Senate':null;if(expected)assert.equal(bill.stage,expected,bill.id);}
});

test('Tracker links round-trip combined filters, sorting, page size and family view',()=>{
 const filters={q:'AI & energy',chamber:'House',topic:'Data Centers, Energy & Infrastructure',engagement:'endorsed',status:'Committee action',recent:'90',sort:'activity',size:'50',view:'families',gap:'1–7 days',returnChart:'companion-gaps'};
 const state=routeState(trackerHash(filters,2));assert.deepEqual(state,{view:'tracker',filters,page:2});
 assert.equal(routeState('#tracker?page=-4&chamber=invalid&size=9000&sort=evil').page,1);assert.deepEqual(routeState('#tracker?chamber=invalid&size=9000&sort=evil').filters,{});
 assert.equal(routeState('#methodology').view,'methodology');assert.equal(routeState('#history').view,'history');assert.equal(routeState('#patterns?chamber=House&chart=focus-areas').view,'charts');
});

test('chart selections reproduce primary-focus, paired-focus, chamber and engagement counts',async()=>{
 const bills=decorateBills(applyCongressData(normalize(await read('public/bills.json')),await read('public/congress-data.json')),await read('public/lifecycle.json'));
 const focus='Trade & Export Controls';assert.equal(matchingBills(bills,{topic:focus,primaryOnly:'1'}).length,bills.filter(b=>b.primary===focus).length);
 assert.equal(matchingBills(bills,{topic:focus,primaryOnly:'1',chamber:'House'}).length,bills.filter(b=>b.primary===focus&&b.chamber==='House').length);
 const pair=JSON.stringify(['Trade & Export Controls','Semiconductors & Advanced Tech']);assert.equal(matchingBills(bills,{pair}).length,bills.filter(b=>[b.primary,b.secondary].sort().join('|')===JSON.parse(pair).sort().join('|')).length);
 assert.equal(matchingBills(bills,{engagement:'unrecorded'}).length,158);
 assert.ok(matchingBills(bills,{band:'50+'}).every(b=>Number(b.cosponsorCount)>=50));
 assert.ok(sortedBills(bills,'activity').every((b,i,list)=>!i||list[i-1].lastActionDate>=b.lastActionDate));
});

test('family matching includes full counterparts but requires a matching version and gap',()=>{
 const f={ids:['H.R.1','S.1'],gap:6};assert.ok(familyMatches(f,new Set(['S.1']),'1–7 days'));assert.equal(familyMatches(f,new Set(['S.2'])),false);assert.equal(familyMatches(f,new Set(['H.R.1']),'Same day'),false);
});

test('official change history records changed facts, not refresh timestamps or editorial fields',()=>{
 const previous={checkedAt:'2026-11-22',records:{'S.1':{officialTitle:'Example',cosponsorCount:1,verifiedAt:'yesterday'}}},next={checkedAt:'2026-11-23',records:{'S.1':{officialTitle:'Example',cosponsorCount:1,verifiedAt:'today',primary:'Edited research'}}};
 assert.equal(recordOfficialChanges(previous,next).events.length,0);next.records['S.1'].cosponsorCount=2;const history=recordOfficialChanges(previous,next);assert.deepEqual(history.events[0].changes[0].fields,['cosponsorCount']);assert.equal(history.events[0].changes[0].before.cosponsorCount,1);assert.equal(history.events[0].changes[0].after.cosponsorCount,2);
});

test('research history distinguishes classification from summary maintenance and removes stale companion prose',async()=>{
 const research=await read('public/research.json'),rows=await read('public/bills.json');assert.ok(research.focusReviewedAt);assert.equal(research.events.find(e=>e.kind==='Classification').changes.length,11);assert.ok(research.events.find(e=>e.kind==='Summary maintenance').changes.length>=20);
 assert.ok(rows.every(b=>!/(?:Senate|House) Companion\b/i.test(b.summary)));assert.ok(!rows.find(b=>b.id==='H.R.633').summary.includes('5/19/26'));
});

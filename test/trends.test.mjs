import test from 'node:test';
import assert from 'node:assert/strict';
import {auditTrends} from '../scripts/audit-trends.mjs';
import {readFile} from 'node:fs/promises';
import {normalize} from '../public/model.js';
import {applyCongressData} from '../public/congress.js';

test('all Trends scopes and chart exports include the reviewed companion additions',async()=>{
 const report=await auditTrends();assert.equal(report.billCount,202);assert.equal(report.originalBillCount,170);assert.equal(report.addedCompanions,32);assert.deepEqual(report.missingAdditions,[]);
 for(const [scope,data] of Object.entries(report.scopes)){
  assert.equal(data.billCount,{'All chambers':202,House:110,Senate:92}[scope]);
  assert.equal(data.monthlyTotal,data.billCount);assert.equal(data.focusAreaTotal,data.billCount);assert.equal(data.cosponsorBandTotal,data.billCount);assert.equal(Object.values(data.engagement).reduce((a,b)=>a+b,0),data.billCount);
  assert.equal(data.charts.length,scope==='All chambers'?12:10);
  for(const chart of data.charts){if(chart.id!=='most-cosponsors')assert.ok(chart.updatedByCompanions,scope+' '+chart.id+' still reflects the original dataset');for(const row of chart.rows)for(const value of row.values)assert.ok(Number.isFinite(value)&&value>=0);}
 }
 assert.equal(report.coverage[0].total,87);assert.equal(report.coverage[1].total,115);assert.equal(report.companionFamilies,42);assert.equal(report.introductionGaps.reduce((n,b)=>n+b.count,0),42);
 assert.deepEqual(report.scopes['All chambers'].engagement,{endorsed:25,engaged:19,unrecorded:158});
});

test('top cosponsor charts rank the complete official dataset, even when the top ten stay unchanged',async()=>{
 const raw=JSON.parse(await readFile(new URL('../public/bills.json',import.meta.url))),snapshot=JSON.parse(await readFile(new URL('../public/congress-data.json',import.meta.url))),bills=applyCongressData(normalize(raw),snapshot),report=await auditTrends();
 for(const [scope,data] of Object.entries(report.scopes)){
  const ranked=bills.filter(b=>scope==='All chambers'||b.chamber===scope).sort((a,b)=>Number(b.cosponsorCount)-Number(a.cosponsorCount)||a.id.localeCompare(b.id)).slice(0,10);
  assert.deepEqual(data.charts.find(c=>c.id==='most-cosponsors').rows,ranked.map(b=>({label:b.id+' · '+b.title,values:[Number(b.cosponsorCount)]})));
 }
});

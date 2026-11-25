import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {routeState} from '../public/explore.js';
import {methodologyPage, scopeCriteria, candidateReviewSteps} from '../public/methodology.js';
import {escapeHtml} from '../public/format.js';
import {reviewHtml} from '../scripts/review-page.mjs';

test('Methodology has its own route and section links while Changelog keeps legacy links', () => {
  assert.deepEqual(routeState('#methodology'), {view:'methodology'});
  assert.deepEqual(routeState('#methodology?section=scope'), {view:'methodology',section:'scope'});
  assert.deepEqual(routeState('#methodology?section=unknown'), {view:'methodology'});
  assert.equal(routeState('#history').view,'changelog');
  assert.equal(routeState('#changelog').view,'changelog');
});

test('candidate review and the published Methodology share inclusion rules and review steps', () => {
  const method=methodologyPage(), review=reviewHtml({candidates:[],candidateCount:0,coverage:{billCount:0,trackedBills:0}});
  for(const criterion of scopeCriteria)for(const page of [method,review]){
    assert.ok(page.includes(escapeHtml(criterion.title)));
    assert.ok(page.includes(escapeHtml(criterion.text)));
  }
  for(const step of candidateReviewSteps)for(const page of [method,review])assert.ok(page.includes(escapeHtml(step)));
});

test('Methodology is a main tab and Changelog is a footer link', async () => {
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  const nav=html.match(/<nav class="view-tabs"[\s\S]*?<\/nav>/)[0],footer=html.match(/<footer>[\s\S]*?<\/footer>/)[0];
  assert.ok(nav.includes('data-view="methodology"'));
  assert.ok(!nav.includes('data-view="changelog"'));
  assert.ok(footer.includes('href="#changelog"'));
});

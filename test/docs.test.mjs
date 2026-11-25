import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { routeState } from "../public/explore.js";
import { docsPage, activeSectionId } from "../public/docs.js";
import { scopeCriteria, candidateReviewSteps } from "../public/scope.js";
import { escapeHtml } from "../public/format.js";
import { reviewHtml } from "../scripts/review-page.mjs";

test("Docs routes preserve old Methodology links and validate section destinations", () => {
  for (const name of ["docs", "documentation", "methodology"]) {
    assert.deepEqual(routeState("#" + name), { view: "docs" });
    assert.deepEqual(routeState("#" + name + "?section=scope"), {
      view: "docs",
      section: "scope",
    });
    assert.deepEqual(routeState("#" + name + "?section=unknown"), {
      view: "docs",
    });
  }
  assert.equal(routeState("#history").view, "changelog");
});

test("candidate review and Docs use the same scope criteria and checklist", () => {
  const docs = docsPage(),
    review = reviewHtml({
      candidates: [],
      candidateCount: 0,
      coverage: { billCount: 0, trackedBills: 0 },
    });
  for (const criterion of scopeCriteria)
    for (const page of [docs, review]) {
      assert.ok(page.includes(escapeHtml(criterion.title)));
      assert.ok(page.includes(escapeHtml(criterion.text)));
    }
  for (const step of candidateReviewSteps)
    for (const page of [docs, review])
      assert.ok(page.includes(escapeHtml(step)));
  assert.ok(
    docs.indexOf("Focus areas are topic labels") <
      docs.indexOf("4.1. How are labels assigned?"),
  );
  assert.ok(
    !/\b(?:I|my|we|our)\b|spreadsheet|fellowship/i.test(
      docs.replace(/<[^>]+>/g, " "),
    ),
  );
});

test("reading progress follows section boundaries and reaches the final section at page bottom", () => {
  assert.equal(
    activeSectionId([
      { id: "overview", top: 200 },
      { id: "updates", top: 600 },
    ]),
    "overview",
  );
  assert.equal(
    activeSectionId([
      { id: "overview", top: -300 },
      { id: "updates", top: 80 },
      { id: "scope", top: 700 },
    ]),
    "updates",
  );
  assert.equal(
    activeSectionId(
      [
        { id: "focus", top: -500 },
        { id: "engagement", top: 70 },
        { id: "data", top: 260 },
      ],
      96,
      true,
    ),
    "data",
  );
  assert.equal(activeSectionId([]), "");
});

test("Docs is a main tab and Changelog stays in the footer", async () => {
  const html = await readFile(
    new URL("../public/index.html", import.meta.url),
    "utf8",
  );
  const nav = html.match(/<nav class="view-tabs"[\s\S]*?<\/nav>/)[0],
    footer = html.match(/<footer>[\s\S]*?<\/footer>/)[0];
  assert.ok(nav.includes('data-view="docs"'));
  assert.ok(!nav.includes('data-view="changelog"'));
  assert.ok(footer.includes('href="#changelog"'));
});

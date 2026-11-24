# Atlas

I built Atlas to make the AI legislation I tracked during my Fall 2026 fellowship at the Software & Information Industry Association (SIIA) easier to explore. It brings my 119th Congress bill tracker into a searchable website, with charts showing patterns across the House and Senate.

## What's in it

The **Tracker** has 202 bills, sorted by bill number by default. You can search by bill number, title, sponsor, or text; filter by chamber, focus area, and SIIA engagement; and open summaries and Congress.gov records. Green labels mark bills SIIA endorsed, and yellow labels mark bills SIIA engaged on without endorsing. Where public materials are available, the labels link to them.

The **Trends** tab looks at introductions over time, policy focus areas, lead sponsors, cosponsors, sponsor party, and SIIA engagement. You can switch between chambers and expand exact counts. Two companion charts show coverage across the House and Senate and the time between the first introduction in each chamber. Bill details link to tracked companions. The SIIA engagement card also has an expandable list of endorsed and engaged bills, with links to bill details and public SIIA materials. Each chart has a Share button for PNG, SVG, CSV, or a link to that chart.

There's a light/dark toggle, and image exports follow the selected appearance. You can also export filtered bill results as CSV.

## Access

The live GitHub Pages site currently has a browser-based password screen. The repository and data files remain public. I've also prepared a server implementation that checks access before serving the app or data, using signed session cookies. It is not deployed yet. Keeping the same URL requires routing `/atlas/` through that server and closing the other public data copies. Setup and the remaining steps are in [Protected hosting](docs/PROTECTED-HOSTING.md).

## Run it locally

You'll need Node.js 24 or newer. There are no packages to install or build steps to run.

```sh
git clone https://github.com/ArikKarim/atlas.git
cd atlas
npm start
```

Open [localhost:4319](http://localhost:4319). On Windows, you can also double-click `Start Atlas.cmd`. To use a different port, set the `PORT` environment variable before starting the server.

Chart links use the address where you're running Atlas, so a localhost link only works on that computer. PNG, SVG, and CSV files can be shared directly.

## About the data

I started with the spreadsheet I maintained during my fellowship. The imported data contains 173 records, representing 170 distinct bills: 94 in the House and 76 in the Senate. The app combines duplicate bill records for the tracker and charts. I subsequently added 32 reviewed House–Senate companion bills, bringing the current tracker to 202 bills. Other discovery candidates stay in the review queue.

I keep the original tracker as my research dataset. Atlas supplements it with official Congress.gov titles, dates, sponsors, cosponsors, and legislative actions. Bill details show my research summary. Public SIIA materials are linked for 42 of the 44 bills with recorded engagement. Companion bills receive their own engagement labels only when there is bill-specific evidence.

## Focus areas

I reviewed all 202 bills and corrected 11 primary or secondary assignments. I classify bills by what their provisions address, rather than by a title keyword or the agency involved. The taxonomy now distinguishes national security, wireless connectivity, digital-asset regulation, and online speech from the existing AI categories. [Focus-area definitions and review notes](docs/FOCUS-AREAS.md) explain the decisions; the full record-by-record audit is in `data/focus-area-review.json`.

## Working on the code

The interface and data are in `public/`. `model.js` handles filtering and normalization, `charts.js` calculates the chart data, and `chart-export.js` and `chart-actions.js` handle exports and sharing. `server.mjs` runs the local server.

Run the checks with:

```sh
npm test
```

They cover the bill data, filters, counts, engagement links, exports, chart links, and server.

`npm run start:secure` starts the protected server after `ATLAS_PASSWORD` is set in its environment. `npm start` remains the local static preview. `npm run audit:trends` checks all chart scopes against the expanded 202-bill dataset, including the 32 reviewed companions; the last audit is saved in `data/trends-audit.json`.

© 2026 Arik Karim

## GitHub Pages

The deployment workflow runs the checks and publishes the contents of public/ whenever I push to main. In the repository's Pages settings, the publishing source should be GitHub Actions. The project URL is https://arikkarim.com/atlas/ because my account's Pages site uses that domain. The hosted site runs entirely in the browser; the Node server is only needed for local use.

## Congress.gov updates

I use the Congress.gov API to refresh the tracked bills daily at 11:23 UTC and when I update the sync script or source data. The API key is stored as the GitHub Actions secret `CONGRESS_GOV_API_KEY`; it is never sent to visitors. I can also run **Sync Congress.gov data** manually from the Actions tab. A successful refresh automatically redeploys the site.

Before updating a bill, the sync checks its Congress, bill type, number, and title against the official record and its alternate titles. It ignores differences in punctuation, leading articles, and title years. A mismatch is saved for review instead of replacing the tracked bill with an unrelated record. I also review title differences such as acronym expansions and record approved matches in `data/congress-identities.json`. Approvals are tied to the exact source title, bill identity, and official title. The Tracker displays official titles, while older names stay searchable. Focus areas, SIIA engagement, public-material links, and my summaries remain my research.

All 202 bills have verified official records. I corrected the AI public-awareness proposal from S.4596 (its 118th Congress number) to S.1699 in the 119th Congress, including its sponsor, date, cosponsors, action, and summary. The correction is recorded in `data/congress-corrections.json`. Trends and chart exports use the same updated records as the Tracker.

The source dataset is `public/bills.json`, the official snapshot is `public/congress-data.json`, and the review report is `data/congress-sync-report.json`. Bill details show when the official record was checked. If a request fails, Atlas keeps previously verified facts with their original verification date; a completely unsuccessful refresh leaves the last published snapshot intact.

For local refreshes, set `CONGRESS_GOV_API_KEY` in the process environment and run `npm run sync:congress`. No API key is needed to view the site or run the tests.

## Finding bills I may have missed

The daily Congress.gov workflow also builds a candidate review queue. It scans all 119th Congress House and Senate bill titles, available CRS summary versions from the start of the Congress, and related-bill links for bills already in Atlas. The scope includes AI, algorithms, data centers and computing, semiconductors and export controls, grid infrastructure, quantum technology, and privacy. It retrieves official sponsors, actions, and subjects for discovered candidates. It does not search full bill text or scan every bill’s subjects.

I review candidates in `data/candidate-review.html`, a standalone page I can download and open locally. It supports search, policy-area and review filters, evidence, notes, and Include / Exclude / Defer decisions. I can export decisions as JSON or the candidate list as CSV. This review page is kept outside the public site. The current list is also in [data/CANDIDATE-REVIEW.md](data/CANDIDATE-REVIEW.md).

To regenerate the queue locally, set `CONGRESS_GOV_API_KEY` and run `npm run discover:congress`. To save exported decisions in the repository, run `npm run review:candidates -- --import path/to/atlas-candidate-decisions.json`. Decisions are tied to bill IDs and official titles; a changed title needs a new review. Included candidates still need a reviewed update with focus areas, a summary, and separately verified SIIA engagement before they enter the Tracker or Trends. Discovery never writes to the published bill dataset.

## Companion bills

I use Congress.gov’s related-bill records to identify House–Senate counterparts, checking matching official titles and substantive purpose. A generic related-bill link alone does not make two proposals companions. Reviewed additions are recorded in `data/companion-additions.json`, and `data/companion-audit.json` lists the relationships used by the site. The daily workflow fills these approved additions with official sponsors, cosponsors, introduction dates, and actions, then refreshes the full tracker.

Companion coverage counts each tracked bill once. Introduction-gap charts group connected companions into bill families and compare the earliest House introduction with the earliest Senate introduction, counting each family once. This avoids counting multiple House versions as separate cross-chamber gaps. Exact dates and family members are available below the chart.

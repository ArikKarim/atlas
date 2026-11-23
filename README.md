# Atlas

I built Atlas to make the AI legislation I tracked during my Fall 2026 fellowship at the Software & Information Industry Association (SIIA) easier to explore. It brings my 119th Congress bill tracker into a searchable website, with charts showing patterns across the House and Senate.

## What's in it

The **Tracker** has 170 bills, sorted by bill number by default. You can search by bill number, title, sponsor, or text; filter by chamber, focus area, and SIIA engagement; and open summaries and Congress.gov records. Green labels mark bills SIIA endorsed, and yellow labels mark bills SIIA engaged on without endorsing. Where public materials are available, the labels link to them.

The **Trends** tab looks at introductions over time, policy focus areas, lead sponsors, cosponsors, sponsor party, and SIIA engagement. You can switch between chambers and expand exact counts. The SIIA engagement card also has an expandable list of endorsed and engaged bills, with links to bill details and public SIIA materials. Each chart has a Share button for PNG, SVG, CSV, or a link to that chart.

There's a light/dark toggle, and image exports follow the selected appearance. You can also export filtered bill results as CSV.

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

I started with the spreadsheet I maintained during my fellowship. The imported data contains 173 records, representing 170 distinct bills: 94 in the House and 76 in the Senate. The app combines duplicate bill records for the tracker and charts.

I keep the original tracker as my research dataset. Atlas supplements it with official Congress.gov titles, dates, sponsors, cosponsors, and legislative actions. The official CRS summary appears separately from my own summary in bill details. Public SIIA materials are linked for 35 of the 37 bills with recorded engagement.

## Working on the code

The interface and data are in `public/`. `model.js` handles filtering and normalization, `charts.js` calculates the chart data, and `chart-export.js` and `chart-actions.js` handle exports and sharing. `server.mjs` runs the local server.

Run the checks with:

```sh
npm test
```

They cover the bill data, filters, counts, engagement links, exports, chart links, and server.

© 2026 Arik Karim

## GitHub Pages

The deployment workflow runs the checks and publishes the contents of public/ whenever I push to main. In the repository's Pages settings, the publishing source should be GitHub Actions. The project URL is https://arikkarim.com/atlas/ because my account's Pages site uses that domain. The hosted site runs entirely in the browser; the Node server is only needed for local use.

## Congress.gov updates

I use the Congress.gov API to refresh the tracked bills daily at 11:23 UTC and when I update the sync script or source data. The API key is stored as the GitHub Actions secret `CONGRESS_GOV_API_KEY`; it is never sent to visitors. I can also run **Sync Congress.gov data** manually from the Actions tab. A successful refresh automatically redeploys the site.

Before updating a bill, the sync checks its Congress, bill type, number, and title against the official record and its alternate titles. It ignores differences in punctuation, leading articles, and title years. A mismatch is saved for review instead of replacing the tracked bill with an unrelated record. I also review title differences such as acronym expansions and record approved matches in `data/congress-identities.json`. Approvals are tied to the exact source title, bill identity, and official title. The Tracker displays official titles, while older names stay searchable. Focus areas, SIIA engagement, public-material links, and my summaries remain my research.

All 170 bills have verified official records. I corrected the AI public-awareness proposal from S.4596 (its 118th Congress number) to S.1699 in the 119th Congress, including its sponsor, date, cosponsors, action, and summary. The correction is recorded in `data/congress-corrections.json`. Trends and chart exports use the same updated records as the Tracker.

The source dataset is `public/bills.json`, the official snapshot is `public/congress-data.json`, and the review report is `data/congress-sync-report.json`. Bill details show when the official record was checked. If a request fails, Atlas keeps previously verified facts with their original verification date; a completely unsuccessful refresh leaves the last published snapshot intact.

For local refreshes, set `CONGRESS_GOV_API_KEY` in the process environment and run `npm run sync:congress`. No API key is needed to view the site or run the tests.

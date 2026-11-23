# Atlas

I built Atlas to make the AI legislation I tracked during my Fall 2026 fellowship at the Software & Information Industry Association (SIIA) easier to explore. It brings my 119th Congress bill tracker into a searchable website, with charts showing patterns across the House and Senate.

## What's in it

The **Bill tracker** has 170 bills. You can search by bill number, title, sponsor, or text; filter by chamber, focus area, and SIIA engagement; and open summaries and Congress.gov records. Green labels mark bills SIIA endorsed, and yellow labels mark bills SIIA engaged on without endorsing. Where public materials are available, the labels link to them.

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

The legislative information reflects that dataset; it doesn't update automatically from Congress.gov. Public SIIA materials are linked for 35 of the 37 bills with recorded engagement.

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

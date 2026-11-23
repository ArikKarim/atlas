# Atlas

A searchable tracker of AI legislation in the 119th Congress, with SIIA engagement links and shareable policy trend charts. Created by Arik Karim during his Fall 2026 AI Policy Fellowship at the Software & Information Industry Association (SIIA).

## Bill tracker

- Search 170 distinct bills across the House and Senate.
- Filter by chamber, focus area, and SIIA engagement; sort by introduction date, title, or cosponsor count.
- Open bill summaries, sponsor information, legislative actions, and Congress.gov records.
- Follow public SIIA materials through the green **Endorsed** and yellow **Engaged, not endorsed** chips.
- Export filtered results as CSV.

## Trends

The All chambers view contains ten charts:

1. Bill introductions by month
2. Top 10 focus areas by bill count
3. Top 10 leading House sponsors
4. Top 10 leading Senate sponsors
5. Top 8 primary–secondary focus-area pairs
6. SIIA engagement across policy areas
7. Cosponsor distribution
8. Top 10 bills by cosponsor count
9. SIIA engagement
10. Lead sponsor party by chamber

Chamber-specific views contain eight charts. Cards align within each desktop row and stack on narrow screens. Exact-count tables expand where available.

Each chart's **Share** button opens a preview with PNG, SVG, CSV, and Copy link options. Image exports match the selected light or dark appearance and include the chart title, scope, labels, and © 2026 Arik Karim credit. Chart links preserve the chamber and selected chart; localhost links are usable on the computer running Atlas.

## Run locally

Requires **Node.js 24 or newer**. There are no external runtime dependencies or build steps.

```sh
git clone https://github.com/ArikKarim/atlas.git
cd atlas
npm start
```

Open **http://localhost:4319**. On Windows, you can also double-click **Start Atlas.cmd**. Set the `PORT` environment variable to use another port.

Use the sun/moon toggle to change appearance. Atlas remembers your selection in browser storage.

## Checks

```sh
npm test
```

The 12 checks cover data normalization, filtering, CSV handling, chart counts, sponsor and party rankings, engagement links, theme-aware image generation, chart links, and the local server.

## Data and sources

The maintained tracker was imported as 173 source records and normalized to 170 distinct bills: 94 House and 76 Senate. Duplicate bill records remain available in the source data for traceability. Legislative information reflects the maintained dataset and is not fetched automatically from Congress.gov.

Public materials are linked for 35 of the 37 bills with recorded SIIA engagement. Most links come from the maintained tracker. RASA and FRONTIER link to SIIA's bill-specific public lobbying disclosure; the NSF AI Education record links to SIIA's statement on the House companion package, with context in bill details. S.1213 and S.3150 retain their recorded engagement status without an unverified hyperlink.

## Project files

| Path | Purpose |
| --- | --- |
| `public/index.html`, `public/style.css`, `public/app.js` | Interface, appearance, navigation, and card layout |
| `public/bills.json` | Imported legislative data |
| `public/model.js`, `public/charts.js` | Normalization, filters, and chart calculations |
| `public/engagement.js` | Public SIIA material links and source context |
| `public/chart-export.js`, `public/chart-actions.js` | Chart exports and sharing dialog |
| `server.mjs` | Local static server and optional header-based session endpoint |
| `test.mjs` | Automated checks |
| `Start Atlas.cmd` | Windows launcher |

The app has no sign-in screen. The optional `/api/session` endpoint reads `x-agc-user-email` and `x-agc-user-name` when supplied by a hosting gateway. The local server binds to `127.0.0.1`.

© 2026 Arik Karim

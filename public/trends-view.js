import { chartContext, chartSpecs } from "./chart-data.js";
import { addChartActions } from "./chart-actions.js";
import {
  monthlyChart,
  wirePlotLinks,
  engagementDetails,
} from "./chart-markup.js";
import { escapeHtml as esc, formatDate as date } from "./format.js";

const sum = (values) => values.reduce((total, value) => total + value, 0);
const legend = (chamber) =>
  (chamber ? [chamber] : ["House", "Senate"])
    .map(
      (name) =>
        `<span class="chart-key"><i class="${name.toLowerCase()}-swatch"></i>${name}</span>`,
    )
    .join("");

function table(headers, rows, label, html = false) {
  return `<details class="chart-values"><summary>${esc(label)}</summary><table class="chart-table"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${html ? cell : esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></details>`;
}

function stackedBars(spec) {
  const maximum = Math.max(1, ...spec.rows.map((row) => sum(row.values)));
  const pair = spec.id === "policy-overlap";
  const band = spec.id === "cosponsor-distribution";
  return `<div class="topic-bars${spec.id === "sponsor-party" ? " party-bars" : ""}">${spec.rows
    .map((row) => {
      const total = sum(row.values);
      const label = pair
        ? row.label
            .split(" + ")
            .map((part, i) =>
              i ? `<span class="pair-second">+ ${esc(part)}</span>` : esc(part),
            )
            .join("")
        : esc(band ? row.label.replace(" cosponsors", "") : row.label);
      const description =
        spec.series.length > 1
          ? `${row.label}: ${spec.series.map((s, i) => s.label + " " + row.values[i]).join(", ")}, total ${total}`
          : `${row.label}: ${total}`;
      return `<div class="topic-row${pair ? " pair-row" : band ? " band-row" : ""}" aria-label="${esc(description)}"><span>${label}</span><div class="bar-space"><div class="stacked-bar" style="width:${(total / maximum) * 100}%">${row.values.map((value, i) => `<span ${spec.series.length > 1 ? `class="${i === 0 ? "house" : "senate"}-fill"` : ""} style="${spec.series.length === 1 ? "background:var(--muted);" : ""}width:${total ? (value / total) * 100 : 0}%" title="${esc(spec.series[i].label)}: ${value}"></span>`).join("")}</div></div><strong>${total}</strong></div>`;
    })
    .join("")}</div>`;
}

function sponsorBars(spec, rankings) {
  const maximum = spec.max;
  const people = rankings[spec.scope];
  const ticks = Array.from(
    { length: maximum + 1 },
    (_, i) => `<span>${i}</span>`,
  ).join("");
  return (
    `<div class="sponsor-bars" role="group" aria-label="Top 10 leading ${spec.scope} sponsors by number of tracked bills. ${spec.rows.map((r) => esc(r.label) + ": " + r.values[0]).join("; ")}">${spec.rows.map((row) => `<div class="sponsor-row"><span>${esc(row.label)}</span><div class="sponsor-bar-track"><div class="sponsor-bar ${spec.scope.toLowerCase()}-fill" style="width:${(row.values[0] / maximum) * 100}%"></div></div><strong>${row.values[0]}</strong></div>`).join("")}</div><div class="sponsor-scale" aria-label="Bills led, scale from 0 to ${maximum}"><span aria-hidden="true"></span><div><div class="sponsor-ticks">${ticks}</div><span class="sponsor-unit">Bills led</span></div><span aria-hidden="true"></span></div>` +
    table(
      ["Lead sponsor", "Tracked bills"],
      people.map((p) => [p.name, p.count]),
      `View all ${spec.scope} sponsors`,
    )
  );
}

function engagementBars(spec) {
  return `<div class="distribution-label"><span>Focus area</span><span>Engaged / total</span></div><div class="engagement-topic-bars">${
    spec.rows
      .map((row) => {
        const total = sum(row.values),
          denominator = row.denominator;
        return `<div class="engagement-topic-row" aria-label="${esc(row.label)}: ${row.values[0]} endorsed, ${row.values[1]} engaged but not endorsed, out of ${denominator} bills"><span>${esc(row.label)}</span><div class="status-track"><div class="engagement-stack">${row.values.map((value, i) => `<span class="${i ? "engaged" : "endorsed"}-swatch" style="width:${(value / denominator) * 100}%"></span>`).join("")}</div></div><strong>${total} / ${denominator}</strong><span class="chart-percent">${Math.round((total / denominator) * 100)}%</span></div>`;
      })
      .join("") || '<p class="chart-empty">No engagement recorded.</p>'
  }</div>`;
}

function panelContent(spec, context) {
  const { data, rankings, companions } = context;
  switch (spec.id) {
    case "monthly-introductions":
      return (
        monthlyChart(data.months) +
        table(
          ["Month", "House", "Senate", "Total"],
          data.months.map((m) => [m.month, m.House, m.Senate, m.total]),
          "View monthly counts",
        )
      );
    case "focus-areas":
      return (
        stackedBars(spec) +
        table(
          ["Focus area", "House", "Senate", "Total"],
          data.topics.map((t) => [t.name, t.House, t.Senate, t.total]),
          "View exact counts",
        )
      );
    case "house-sponsors":
    case "senate-sponsors":
      return sponsorBars(spec, rankings);
    case "engagement-by-area":
      return engagementBars(spec);
    case "cosponsor-distribution":
      return (
        '<div class="distribution-label">Cosponsors per bill <span>Number of bills</span></div>' +
        stackedBars(spec)
      );
    case "most-cosponsors":
      return (
        '<div class="distribution-label"><span>Bill</span><span>Cosponsors</span></div><ol class="cosponsor-list">' +
        data.topCosponsors
          .map(
            (b) =>
              `<li><div><button class="bill-number" data-bill="${esc(b.id)}">${esc(b.id)}</button><span>${esc(b.title)}</span></div><strong>${esc(b.cosponsorCount)}</strong></li>`,
          )
          .join("") +
        "</ol>"
      );
    case "siia-engagement": {
      const total = data.rows.length;
      return (
        `<div class="status-bars">${spec.rows.map((row, i) => `<div class="status-row"><span>${esc(row.label)}</span><div class="status-track"><div class="status-fill ${["green", "amber", "unrecorded"][i]}" style="width:${total ? (row.values[0] / total) * 100 : 0}%"></div></div><strong>${row.values[0]}</strong><span class="chart-percent">${total ? Math.round((row.values[0] / total) * 100) : 0}%</span></div>`).join("")}</div>` +
        engagementDetails(data.rows)
      );
    }
    case "sponsor-party":
      return (
        stackedBars(spec) +
        table(
          ["Party", "House", "Senate", "Total"],
          spec.rows.map((r) => [r.label, ...r.values, sum(r.values)]),
          "View exact counts",
        )
      );
    case "companion-coverage":
      return (
        '<div class="distribution-label"><span>Tracked bills</span><span>Bills</span></div>' +
        stackedBars(spec) +
        table(
          ["Coverage", "House", "Senate", "Total"],
          companions.coverage.map((r) => [r.label, r.House, r.Senate, r.total]),
          "View exact counts",
        )
      );
    case "companion-gaps":
      return (
        '<div class="distribution-label"><span>Days between first House and Senate introductions</span><span>Bill families</span></div>' +
        stackedBars(spec) +
        table(
          [
            "Bill family",
            "First House introduction",
            "First Senate introduction",
            "Days apart",
          ],
          companions.families.map((f) => [
            f.ids
              .map(
                (id) =>
                  `<button class="bill-number" data-bill="${esc(id)}">${esc(id)}</button>`,
              )
              .join(" · "),
            date(f.house.introduced),
            date(f.senate.introduced),
            f.gap,
          ]),
          `View companion families (${companions.families.length})`,
          true,
        )
      );
    default:
      return stackedBars(spec);
  }
}

export function renderTrends({ main, bills, chamber = "", onChamber }) {
  const context = chartContext(bills, chamber);
  const specs = chartSpecs(bills, chamber, context);
  const order = [
    "monthly-introductions",
    "focus-areas",
    "house-sponsors",
    "senate-sponsors",
    "policy-overlap",
    "engagement-by-area",
    "cosponsor-distribution",
    "most-cosponsors",
    "siia-engagement",
    "sponsor-party",
    "companion-coverage",
    "companion-gaps",
  ];
  main.innerHTML = `<section class="page-heading charts-heading"><div><h1>AI policy trends</h1><p>${context.data.rows.length} bills tracked · 2025–2026</p></div><label>Chamber<select id="chart-chamber" aria-label="Chart chamber">${[
    ["", "All chambers"],
    ["House", "House"],
    ["Senate", "Senate"],
  ]
    .map(
      ([value, label]) =>
        `<option value="${value}"${value === chamber ? " selected" : ""}>${label}</option>`,
    )
    .join("")}</select></label></section><div class="overview-grid"></div>`;
  const grid = main.querySelector(".overview-grid");
  for (const spec of specs.sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
  )) {
    const panel = document.createElement("section");
    panel.className =
      "chart-panel" + (spec.id.endsWith("-sponsors") ? " sponsor-panel" : "");
    const keys =
      spec.id === "engagement-by-area"
        ? '<span class="chart-key"><i class="endorsed-swatch"></i>Endorsed</span><span class="chart-key"><i class="engaged-swatch"></i>Engaged, not endorsed</span>'
        : [
              "monthly-introductions",
              "focus-areas",
              "policy-overlap",
              "cosponsor-distribution",
              "sponsor-party",
              "companion-coverage",
            ].includes(spec.id)
          ? legend(chamber)
          : "";
    panel.innerHTML = `<div class="chart-heading"><h2>${esc(spec.title)}</h2>${keys ? `<div class="chart-legend">${keys}</div>` : ""}</div><div class="overview-plot">${panelContent(spec, context)}</div>`;
    const values = panel.querySelector(".chart-values");
    if (values) {
      const footer = document.createElement("div");
      footer.className = "chart-footer";
      footer.append(values);
      panel.append(footer);
    }
    addChartActions(panel, spec, chamber);
    panel
      .querySelector(".chart-heading")
      .append(panel.querySelector(".chart-actions"));
    wirePlotLinks(panel, spec, chamber);
    grid.append(panel);
  }
  main.querySelector("#chart-chamber").onchange = (event) =>
    onChamber(event.target.value);
}

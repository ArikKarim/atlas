import { engagementKind } from "./model.js";
import { escapeHtml as esc } from "./format.js";
import { engagementUrl, engagementDescription } from "./engagement.js";
export function monthlyChart(months) {
  const width = 560,
    height = 250,
    left = 35,
    right = 12,
    top = 16,
    bottom = 70,
    plotHeight = height - top - bottom,
    plotWidth = width - left - right,
    base = top + plotHeight;
  const maximum = Math.max(1, ...months.map((m) => m.total)),
    step = Math.max(1, Math.ceil(maximum / 4)),
    ceiling = Math.ceil(maximum / step) * step,
    slot = plotWidth / months.length,
    bar = slot * 0.64;
  let marks = "";
  for (let n = 0; n <= ceiling; n += step) {
    const y = base - (n / ceiling) * plotHeight;
    marks += `<line class="chart-gridline" x1="${left}" x2="${width - right}" y1="${y}" y2="${y}"/><text class="chart-axis" x="${left - 8}" y="${y + 4}" text-anchor="end">${n}</text>`;
  }
  months.forEach((m, i) => {
    const center = left + (i + 0.5) * slot,
      x = center - bar / 2,
      house = (m.House / ceiling) * plotHeight,
      senate = (m.Senate / ceiling) * plotHeight,
      label = new Date(m.month + "-15T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    marks += `<g><title>${label}: House ${m.House}, Senate ${m.Senate}, total ${m.total}</title><rect class="house-fill" x="${x}" y="${base - house}" width="${bar}" height="${house}"/><rect class="senate-fill" x="${x}" y="${base - house - senate}" width="${bar}" height="${senate}"/></g><line class="month-tick" x1="${center}" x2="${center}" y1="${base}" y2="${base + 4}"/>`;
    if (i % 3 === 0)
      marks += `<text class="chart-month" x="${center}" y="${base + 21}" text-anchor="middle">${label.split(" ")[0]}</text>`;
  });
  for (let year = 0; year < 2; year++) {
    const x0 = left + year * slot * 12 + 10,
      x1 = left + (year + 1) * slot * 12 - 10,
      y = base + 35;
    marks += `<path class="year-bracket" d="M${x0} ${y}H${x1}"/><text class="chart-year" x="${(x0 + x1) / 2}" y="${base + 56}" text-anchor="middle">${2025 + year}</text>`;
  }
  return `<svg class="monthly-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly bill introductions, grouped under 2025 and 2026. Each bar is one month, stacked by House and Senate. Exact values are listed below.">${marks}</svg>`;
}

export function wirePlotLinks(panel, spec, chartsChamber) {
  const base = chartsChamber ? { chamber: chartsChamber } : {};
  panel.querySelector(".sponsor-bars")?.setAttribute("role", "group");
  const attach = (node, selection, label, keyboard = true) => {
    if (!node) return;
    const tag = node.tagName.toLowerCase();
    if (
      (tag === "rect" && Number(node.getAttribute("height")) <= 0) ||
      (tag === "span" &&
        node.style.width &&
        Number.parseFloat(node.style.width) <= 0)
    )
      return;
    node.dataset.explore = JSON.stringify(selection);
    node.classList.add("explore-target");
    node.title = "View matching bills in Tracker";
    if (keyboard) {
      node.tabIndex = 0;
      node.setAttribute("role", "link");
      node.setAttribute(
        "aria-label",
        (node.getAttribute("aria-label") || label) +
          ". View matching bills in Tracker",
      );
    }
  };
  if (spec.id === "monthly-introductions") {
    panel.querySelector(".monthly-chart")?.setAttribute("role", "group");
    panel.querySelectorAll(".monthly-chart g").forEach((node, i) => {
      const row = spec.rows[i];
      attach(node, { ...base, month: row.label }, row.label);
      node
        .querySelectorAll("rect")
        .forEach((rect, j) =>
          attach(
            rect,
            { month: row.label, chamber: j === 0 ? "House" : "Senate" },
            row.label,
            false,
          ),
        );
    });
    return;
  }
  const selector =
    spec.id === "engagement-by-area"
      ? ".engagement-topic-row"
      : spec.id === "siia-engagement"
        ? ".status-row"
        : spec.id.endsWith("-sponsors")
          ? ".sponsor-row"
          : ".topic-row";
  panel.querySelectorAll(selector).forEach((node, i) => {
    const row = spec.rows[i];
    if (!row) return;
    let selection = { ...base };
    if (spec.id === "focus-areas")
      selection = { ...base, topic: row.label, primaryOnly: "1" };
    else if (spec.id === "policy-overlap")
      selection = { ...base, pair: JSON.stringify(row.label.split(" + ")) };
    else if (spec.id === "engagement-by-area")
      selection = {
        ...base,
        topic: row.label,
        primaryOnly: "1",
        engagement: "recorded",
      };
    else if (spec.id === "cosponsor-distribution")
      selection = { ...base, band: row.label.replace(" cosponsors", "") };
    else if (spec.id === "siia-engagement")
      selection = {
        ...base,
        engagement: i === 0 ? "endorsed" : i === 1 ? "engaged" : "unrecorded",
      };
    else if (spec.id.endsWith("-sponsors"))
      selection = { chamber: spec.scope, sponsor: row.label };
    else if (spec.id === "sponsor-party")
      selection = { ...base, party: ["D", "R", "I", "other"][i] };
    else if (spec.id === "companion-coverage")
      selection = { ...base, companion: i === 0 ? "yes" : "no" };
    else if (spec.id === "companion-gaps")
      selection = { view: "families", gap: row.label };
    else return;
    attach(node, selection, row.label);
    if (
      [
        "focus-areas",
        "policy-overlap",
        "cosponsor-distribution",
        "sponsor-party",
        "companion-coverage",
      ].includes(spec.id)
    )
      node
        .querySelectorAll(".stacked-bar>span")
        .forEach((segment, j) =>
          attach(
            segment,
            { ...selection, chamber: j === 0 ? "House" : "Senate" },
            row.label,
            false,
          ),
        );
    if (spec.id === "engagement-by-area")
      node
        .querySelectorAll(".engagement-stack>span")
        .forEach((segment, j) =>
          attach(
            segment,
            { ...selection, engagement: j === 0 ? "endorsed" : "engaged" },
            row.label,
            false,
          ),
        );
  });
}

export function engagementDetails(rows) {
  const groups = [
    {
      label: "Endorsed",
      style: "green",
      match: (b) => engagementKind(b.engagement) === "endorsed",
    },
    {
      label: "Engaged, not endorsed",
      style: "amber",
      match: (b) => engagementKind(b.engagement) === "engaged",
    },
  ].map((group) => ({
    ...group,
    bills: rows
      .filter(group.match)
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })),
  }));
  const count = groups.reduce((n, g) => n + g.bills.length, 0);
  return `<details class="chart-values engagement-details"><summary>View engaged bills (${count})</summary><div class="engagement-bills">${groups
    .map(
      (group) =>
        `<section class="engagement-group" aria-label="${esc(group.label)} bills"><h3><span class="tag ${group.style}">${esc(group.label)}</span><span class="engagement-group-count">${group.bills.length}</span></h3>${
          group.bills.length
            ? `<ul>${group.bills
                .map((b) => {
                  const url = engagementUrl(b);
                  return `<li><button type="button" class="engagement-bill" data-bill="${esc(b.id)}">${esc(b.id)} · ${esc(b.title)}</button><div class="engagement-bill-meta"><span>${esc(b.chamber)}</span>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(engagementDescription(b))}" aria-label="Public SIIA material for ${esc(b.id)} (opens in a new tab)">SIIA material ↗</a>` : ""}</div></li>`;
                })
                .join("")}</ul>`
            : '<p class="chart-empty">No bills in this selection.</p>'
        }</section>`,
    )
    .join("")}</div></details>`;
}

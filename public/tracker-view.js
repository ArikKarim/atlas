import {
  matchingBills,
  sortedBills,
  trackerHash,
  familyMatches,
  stages,
  sortOptions,
} from "./explore.js";
import { escapeHtml as esc, formatDate as day } from "./format.js";
import { csv } from "./model.js";
import { saveFile } from "./download.js";
const options = (items, value) =>
  items
    .map(
      ([v, label]) =>
        `<option value="${esc(v)}"${String(value || "") === String(v) ? " selected" : ""}>${esc(label)}</option>`,
    )
    .join("");
const chevron = (id, label, paths, disabled) =>
  `<button type="button" class="plain page-arrow" id="${id}" aria-label="${label}" title="${label}"${disabled ? " disabled" : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths}"/></svg></button>`;
export function renderTracker({
  main,
  bills,
  families,
  filters: initial = {},
  page: initialPage = 1,
  badge,
  onState,
  onChart,
}) {
  let filters = { ...initial },
    page = initialPage;
  const topics = [
    ...new Set(bills.flatMap((b) => [b.primary, b.secondary]).filter(Boolean)),
  ].sort();
  const filterLabel = (id, label, choices) =>
    `<label>${label}<select id="${id}" aria-label="${label}">${options(choices, filters[id])}</select></label>`;
  main.innerHTML = `<section class="page-heading"><div><h1>119th Congress AI bills</h1><p>2025–2026 · ${bills.length} bills · ${bills.filter((b) => b.chamber === "House").length} House · ${bills.filter((b) => b.chamber === "Senate").length} Senate</p></div></section><div id="chart-return"></div><form class="toolbar expanded-toolbar" id="filters"><label class="search-field">Search bills<input id="search" type="search" placeholder="Bill number, title, sponsor or text" value="${esc(filters.q)}"></label>${filterLabel(
    "chamber",
    "Chamber",
    [
      ["", "All chambers"],
      ["House", "House"],
      ["Senate", "Senate"],
    ],
  )}${filterLabel("topic", "Focus area", [["", "All focus areas"], ...topics.map((t) => [t, t])])}${filterLabel(
    "engagement",
    "SIIA engagement",
    [
      ["", "All records"],
      ["recorded", "Engagement recorded"],
      ["endorsed", "Endorsed"],
      ["engaged", "Engaged, not endorsed"],
      ["unrecorded", "No engagement recorded"],
    ],
  )}${filterLabel("status", "Status", [["", "All stages"], ...stages.map((t) => [t, t])])}${filterLabel(
    "recent",
    "Last action",
    [
      ["", "Any date"],
      ["7", "Past 7 days"],
      ["30", "Past 30 days"],
      ["90", "Past 90 days"],
    ],
  )}${filterLabel("sort", "Sort by", sortOptions)}</form><div class="tracker-tools"><div class="saved-views" role="group" aria-label="Quick views"><button class="plain" data-preset="all">All bills</button><button class="plain" data-preset="engaged">SIIA engagement</button><button class="plain" data-preset="recent">Recently active</button></div><label>View<select id="record-view" aria-label="Tracker view">${options(
    [
      ["bills", "Bills"],
      ["families", "Companion families"],
    ],
    filters.view || "bills",
  )}</select></label></div><div id="active-selection"></div><div id="results"></div>`;
  const sync = () => {
    onState(filters, page);
    history.replaceState(null, "", trackerHash(filters, page));
  };
  const exportCsv = (rows) =>
    saveFile(
      "atlas-119th-congress.csv",
      csv(rows, [
        "id",
        "title",
        "chamber",
        "stage",
        "lastActionDate",
        "primary",
        "secondary",
        "sponsor",
        "cosponsors",
        "cosponsorCount",
        "introduced",
        "action",
        "summary",
        "engagement",
      ]),
      "text/csv;charset=utf-8",
    );
  function renderResults() {
    const rows = sortedBills(matchingBills(bills, filters), filters.sort),
      ids = new Set(rows.map((b) => b.id)),
      grouped = families.filter((f) => familyMatches(f, ids, filters.gap)),
      familyView = filters.view === "families",
      items = familyView ? grouped : rows;
    const size =
        filters.size === "all"
          ? Math.max(1, items.length)
          : Number(filters.size || 25),
      pages = Math.max(1, Math.ceil(items.length / size));
    page = Math.min(page, pages);
    const start = (page - 1) * size,
      selected = items.slice(start, start + size),
      active = Object.entries(filters).some(
        ([k, v]) =>
          v &&
          !["sort", "size", "view", "returnChart", "returnChamber"].includes(k),
      );
    sync();
    main.querySelector("#chart-return").innerHTML = filters.returnChart
      ? '<button class="text-button return-chart">Back to chart</button>'
      : "";
    const back = main.querySelector(".return-chart");
    if (back)
      back.onclick = () =>
        onChart(filters.returnChamber || "", filters.returnChart);
    const special = [
      filters.month && "Introduced " + filters.month,
      filters.sponsor && "Sponsor: " + filters.sponsor,
      filters.party && "Sponsor party: " + filters.party,
      filters.band && filters.band + " cosponsors",
      filters.companion &&
        (filters.companion === "yes"
          ? "Has a companion"
          : "No tracked companion"),
      filters.pair && "Selected focus-area pair",
      filters.gap && "Introduction gap: " + filters.gap,
      filters.primaryOnly && "Primary focus only",
    ].filter(Boolean);
    main.querySelector("#active-selection").innerHTML = special.length
      ? `<div class="selection-chips" aria-label="Chart selection">${special.map((t) => `<span>${esc(t)}</span>`).join("")}</div>`
      : "";
    const cell = (b) =>
      `<tr><td class="id-cell"><button class="bill-number" data-bill="${esc(b.id)}">${esc(b.id)}</button><span class="sub">${b.chamber}</span></td><td class="title-cell"><button class="bill-title" data-bill="${esc(b.id)}">${esc(b.title)}</button><span class="sub">Introduced ${day(b.introduced)} · ${esc(b.cosponsorCount)} ${Number(b.cosponsorCount) === 1 ? "cosponsor" : "cosponsors"}</span></td><td class="topic-cell">${esc(b.primary)}${b.secondary ? `<div class="sub">${esc(b.secondary)}</div>` : ""}</td><td>${esc(b.sponsor)}</td><td class="action-cell"><span class="stage-label">${esc(b.stage)}</span><div class="sub">${day(b.lastActionDate)}</div><button class="detail-link" data-bill="${esc(b.id)}" aria-label="Details for ${esc(b.id)}">Details</button></td><td class="engagement-cell">${badge(b)}</td></tr>`;
    const familyCard = (f) => {
      const versions = f.ids
        .map((id) => bills.find((b) => b.id === id))
        .filter(Boolean);
      return `<section class="family-card"><div class="family-heading"><h2>${esc(f.house.title)}</h2><span>${versions.length} tracked versions · ${f.gap === 0 ? "Same-day introductions" : f.gap + " days between introductions"}</span></div><div class="family-versions">${versions.map((b) => `<article class="family-version"><div class="family-version-top"><span class="chamber-label ${b.chamber.toLowerCase()}">${b.chamber}</span><button class="bill-number" data-bill="${esc(b.id)}">${esc(b.id)}</button>${ids.has(b.id) ? '<span class="matches-selection">Matches filters</span>' : ""}</div><h3><button class="bill-title" data-bill="${esc(b.id)}">${esc(b.title)}</button></h3><dl><dt>Status</dt><dd>${esc(b.stage)}</dd><dt>Introduced</dt><dd>${day(b.introduced)}</dd><dt>Last action</dt><dd>${day(b.lastActionDate)}</dd><dt>Lead sponsor</dt><dd>${esc(b.sponsor)}</dd><dt>Cosponsors</dt><dd>${esc(b.cosponsorCount)}</dd></dl><p>${badge(b)}</p></article>`).join("")}</div></section>`;
    };
    main.querySelector("#results").innerHTML =
      `<div class="result-line"><span role="status" aria-live="polite"><strong>${items.length}</strong> ${familyView ? "companion " + (items.length === 1 ? "family" : "families") : items.length === 1 ? "bill" : "bills"}${items.length ? " · Showing " + (start + 1) + "–" + Math.min(start + size, items.length) : ""}${familyView ? " · " + grouped.reduce((n, f) => n + f.ids.length, 0) + " tracked versions" : ""}</span><div><button class="plain" id="copy-view">Copy view link</button><button class="plain" id="reset"${!active ? " disabled" : ""}>Clear filters</button><button class="plain" id="export"${!items.length ? " disabled" : ""}>Export CSV</button></div></div><div id="view-link-status" role="status"></div>${familyView ? '<div class="family-list">' + selected.map(familyCard).join("") + "</div>" : `<div class="table-wrap" tabindex="0" role="region" aria-label="Bill results, scroll horizontally for more columns"><table><thead><tr>${["Bill", "Title", "Focus area", "Lead sponsors", "Status / last action", "SIIA engagement"].map((t) => `<th scope="col">${t}</th>`).join("")}</tr></thead><tbody>${selected.length ? selected.map(cell).join("") : '<tr><td colspan="6" class="empty">No results match this view. Adjust or clear the filters.</td></tr>'}</tbody></table></div>`}${familyView && !items.length ? '<div class="empty">No results match this view. Adjust or clear the filters.</div>' : ""}<div class="pager"><label>Rows per page <select id="page-size" aria-label="Rows per page">${options(
        [
          ["25", "25"],
          ["50", "50"],
          ["all", "All"],
        ],
        filters.size || "25",
      )}</select></label><div role="group" aria-label="Pagination">${chevron("first", "First page", "m11 17-5-5 5-5m7 10-5-5 5-5", page === 1)}${chevron("prev", "Previous page", "m15 18-6-6 6-6", page === 1)}<span class="page-position" tabindex="-1" aria-live="polite">Page ${page} of ${pages}</span>${chevron("next", "Next page", "m9 18 6-6-6-6", page === pages)}${chevron("last", "Last page", "m6 17 5-5-5-5m7 10 5-5-5-5", page === pages)}</div></div>`;
    const navigate = (next, id) => {
      page = Math.max(1, Math.min(pages, next));
      renderResults();
      main.querySelector(".table-wrap,.family-list")?.scrollTo({ top: 0 });
      const control = main.querySelector("#" + id);
      (control?.disabled
        ? main.querySelector(".page-position")
        : control
      )?.focus({ preventScroll: true });
    };
    for (const [id, next] of [
      ["first", 1],
      ["prev", page - 1],
      ["next", page + 1],
      ["last", pages],
    ])
      main.querySelector("#" + id).onclick = () => navigate(next, id);
    main.querySelector("#page-size").onchange = (e) => {
      filters.size = e.target.value;
      page = 1;
      renderResults();
    };
    main.querySelector("#reset").onclick = () => {
      filters = { sort: filters.sort, size: filters.size, view: filters.view };
      page = 1;
      onState(filters, page);
      renderTracker({
        main,
        bills,
        families,
        filters,
        page,
        badge,
        onState,
        onChart,
        onBill,
      });
    };
    main.querySelector("#export").onclick = () =>
      exportCsv(
        familyView
          ? bills.filter((b) =>
              new Set(grouped.flatMap((f) => f.ids)).has(b.id),
            )
          : rows,
      );
    main.querySelector("#copy-view").onclick = async () => {
      const url = new URL(location.href);
      url.hash = trackerHash(filters, page);
      const status = main.querySelector("#view-link-status");
      try {
        await navigator.clipboard.writeText(url.href);
        status.textContent = "View link copied.";
      } catch {
        status.innerHTML =
          '<label class="copy-fallback">View link<input readonly aria-label="View link" value="' +
          esc(url.href) +
          '"></label>';
        status.querySelector("input").select();
      }
    };
  }
  main.querySelector("#filters").onsubmit = (e) => e.preventDefault();
  main.querySelector("#search").oninput = (e) => {
    filters.q = e.target.value;
    page = 1;
    renderResults();
  };
  for (const id of [
    "chamber",
    "topic",
    "engagement",
    "status",
    "recent",
    "sort",
  ])
    main.querySelector("#" + id).onchange = (e) => {
      filters[id] = e.target.value;
      page = 1;
      if (id === "topic") {
        delete filters.primaryOnly;
        delete filters.pair;
      }
      renderResults();
    };
  main.querySelector("#record-view").onchange = (e) => {
    filters.view = e.target.value;
    page = 1;
    renderResults();
  };
  for (const button of main.querySelectorAll("[data-preset]"))
    button.onclick = () => {
      const type = button.dataset.preset;
      filters = {
        size: filters.size,
        ...(type === "engaged"
          ? { engagement: "recorded" }
          : type === "recent"
            ? { recent: "30", sort: "activity" }
            : {}),
      };
      page = 1;
      onState(filters, page);
      renderTracker({
        main,
        bills,
        families,
        filters,
        page,
        badge,
        onState,
        onChart,
        onBill,
      });
    };
  renderResults();
}

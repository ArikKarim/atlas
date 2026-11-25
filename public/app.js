import { engagementKind } from "./model.js";
import { renderTracker } from "./tracker-view.js";
import { routeState, trackerHash } from "./explore.js";
import { changelogPage } from "./changelog.js";
import { methodologyPage } from "./methodology.js";
import { companionStats } from "./companions.js";
import { patternsHash } from "./chart-export.js";
import { engagementUrl, engagementDescription } from "./engagement.js";
import { escapeHtml as esc } from "./format.js";
import { initializeTheme } from "./theme.js";
import { billDetails } from "./bill-detail.js";
import { renderTrends } from "./trends-view.js";
import { buildBills } from "./data.js";
const $ = (s) => document.querySelector(s);
let bills = [],
  page = 1,
  filters = { q: "", chamber: "", topic: "", engagement: "" };
const main = $("main"),
  dialog = $("#detail");
let chartsChamber = "",
  requestedChart = "",
  snapshot = {},
  research = {},
  officialChanges = {},
  releases = [],
  familyData = [];
const badge = (b) => {
  if (!b.engagement) return '<span class="sub">No engagement recorded</span>';
  const label = esc(b.engagement.replace(/\.$/, "")),
    style = engagementKind(b.engagement) === "endorsed" ? "green" : "amber",
    url = engagementUrl(b);
  return url
    ? '<a class="tag ' +
        style +
        '" href="' +
        esc(url) +
        '" target="_blank" rel="noopener noreferrer" aria-label="' +
        label +
        ": public SIIA material for " +
        esc(b.id) +
        ' (opens in a new tab)" title="' +
        esc(engagementDescription(b)) +
        '">' +
        label +
        "</a>"
    : '<span class="tag ' +
        style +
        '" title="Public SIIA material has not been linked for this bill">' +
        label +
        "</span>";
};
function show(html) {
  $("#dialog-body").innerHTML = html;
  dialog.showModal();
}
$(".close").onclick = () => dialog.close();
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close();
});

initializeTheme();

function tracker() {
  renderTracker({
    main,
    bills,
    families: familyData,
    filters,
    page,
    badge,
    onState: (next, p) => {
      filters = { ...next };
      page = p;
    },
    onChart: (chamber, chart) => navigateChart(chamber, chart),
  });
}
function navigateChart(chamber, chart) {
  chartsChamber = chamber;
  requestedChart = chart;
  showView("charts", { chamber, chart }, true);
}

function billDetail(id) {
  const bill = bills.find((b) => b.id === id);
  if (bill) show(billDetails(bill, research, badge));
}
function charts() {
  renderTrends({
    main,
    bills,
    chamber: chartsChamber,
    onChamber: (chamber) => {
      chartsChamber = chamber;
      history.replaceState(null, "", patternsHash(chamber));
      charts();
    },
  });
}
function showView(view, state, push = false) {
  if (state) {
    if (view === "tracker") {
      filters = { ...(state.filters || {}) };
      page = state.page || 1;
    } else if (view === "charts") {
      chartsChamber = state.chamber || "";
      requestedChart = state.chart || "";
    }
  }

  document.querySelectorAll("[data-view]").forEach((button) => {
    const selected = button.dataset.view === view;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex =
      selected || (view === "changelog" && button.dataset.view === "tracker")
        ? 0
        : -1;
  });
  const changelogLink = document.getElementById("changelog-link");
  if (view === "changelog") changelogLink.setAttribute("aria-current", "page");
  else changelogLink.removeAttribute("aria-current");
  main.setAttribute("role", view === "changelog" ? "region" : "tabpanel");
  main.setAttribute(
    "aria-labelledby",
    view === "charts"
      ? "charts-tab"
      : view === "changelog"
        ? "changelog-title"
        : view === "methodology"
          ? "methodology-tab"
          : "tracker-tab",
  );
  const hash =
    view === "charts"
      ? patternsHash(chartsChamber, requestedChart)
      : view === "tracker"
        ? trackerHash(filters, page)
        : "#" + view + (state?.section ? "?section=" + state.section : "");
  if (location.hash !== hash)
    history[push ? "pushState" : "replaceState"](null, "", hash);
  if (view === "charts") {
    charts();
    if (requestedChart) {
      const target = document.getElementById(requestedChart);
      if (target)
        requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
      requestedChart = "";
    }
  } else if (view === "methodology") {
    main.innerHTML = methodologyPage({ research });
    if (state?.section)
      requestAnimationFrame(() =>
        document
          .getElementById("method-" + state.section)
          ?.scrollIntoView({ block: "start" }),
      );
  } else if (view === "changelog")
    main.innerHTML = changelogPage({
      research,
      snapshot,
      officialChanges,
      releases,
    });
  else tracker();
  if (!state?.section && (view !== "charts" || !state?.chart))
    window.scrollTo({ top: 0 });
}
for (const button of document.querySelectorAll("[data-view]")) {
  button.onclick = () => showView(button.dataset.view, null, true);
  button.onkeydown = (e) => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const tabs = [...document.querySelectorAll("[data-view]")],
        i = tabs.indexOf(button),
        next =
          e.key === "Home"
            ? tabs[0]
            : e.key === "End"
              ? tabs.at(-1)
              : tabs[
                  (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                    tabs.length
                ];
      showView(next.dataset.view, null, true);
      next.focus();
    }
  };
}
const restore = () => {
  const state = routeState(location.hash);
  showView(state.view, state);
};
window.addEventListener("hashchange", restore);

function openTrackerSelection(selection, chart) {
  filters = { ...selection, returnChart: chart, returnChamber: chartsChamber };
  page = 1;
  showView("tracker", null, true);
  main.setAttribute("tabindex", "-1");
  main.focus({ preventScroll: true });
}
document.addEventListener("click", (e) => {
  const bill = e.target.closest("[data-bill]");
  if (bill) {
    billDetail(bill.dataset.bill);
    return;
  }
  const nav = e.target.closest("[data-view-link]");
  if (nav) {
    e.preventDefault();
    if (dialog.open) dialog.close();
    showView(nav.dataset.viewLink, null, true);
    main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
    return;
  }
  const plot = e.target.closest("[data-explore]");
  if (plot) {
    let selection;
    try {
      selection = JSON.parse(plot.dataset.explore);
    } catch {
      return;
    }
    openTrackerSelection(selection, plot.closest(".chart-panel").id);
  }
});
document.addEventListener("keydown", (e) => {
  if (
    (e.key === "Enter" || e.key === " ") &&
    e.target.matches("[data-explore]")
  ) {
    e.preventDefault();
    e.target.click();
  }
});
try {
  const load = async (name) => {
    const r = await fetch(new URL("./" + name, import.meta.url), {
      cache: "no-cache",
    });
    if (!r.ok) throw Error(name);
    return r.json();
  };
  const [source, official, review, activity, lifecycle, updates] =
    await Promise.all([
      load("bills.json"),
      load("congress-data.json").catch(() => ({})),
      load("research.json").catch(() => ({})),
      load("official-changes.json").catch(() => ({})),
      load("lifecycle.json").catch(() => ({})),
      load("changelog.json").catch(() => []),
    ]);

  snapshot = official;
  research = review;
  officialChanges = activity;
  releases = updates;
  bills = buildBills(source, snapshot, lifecycle);
  familyData = companionStats(bills).families;
  restore();
} catch (error) {
  console.error("Atlas initialization failed", error);
  main.innerHTML =
    '<div class="notice">The tracker data could not be loaded. Refresh this page to try again.</div>';
}

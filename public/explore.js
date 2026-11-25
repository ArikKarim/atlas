import { filterBills } from "./model.js";
export const stages = [
  "Introduced",
  "Committee action",
  "Passed House",
  "Passed Senate",
  "Passed both chambers",
  "Enacted",
];
export function legislativeStage(actions = []) {
  let house = false,
    senate = false,
    committee = false,
    enacted = false;
  for (const a of actions) {
    const text = String(a.text || ""),
      type = String(a.type || "");
    if (
      type === "BecameLaw" ||
      /became public law|became private law|became law|signed by president|enacted over.*veto/i.test(
        text,
      )
    )
      enacted = true;
    if (
      /passed house|passed\/agreed to in house|house agreed to (?:the )?senate amendment/i.test(
        text,
      ) ||
      (/on passage[\s\S]*passed/i.test(text) &&
        /house/i.test(a.source || a.sourceSystem?.name || ""))
    )
      house = true;
    if (
      /passed senate|passed\/agreed to in senate|senate agreed to (?:the )?house amendment/i.test(
        text,
      )
    )
      senate = true;
    if (
      type === "Committee" ||
      /ordered to be reported|reported by|committee (?:consideration|hearings|markup)|placed on (?:the )?(?:union|house|senate legislative) calendar|committee discharged/i.test(
        text,
      )
    )
      committee = true;
  }
  return enacted
    ? "Enacted"
    : house && senate
      ? "Passed both chambers"
      : house
        ? "Passed House"
        : senate
          ? "Passed Senate"
          : committee
            ? "Committee action"
            : "Introduced";
}
export function decorateBills(bills, lifecycle) {
  return bills.map((b) => {
    const entry = lifecycle?.records?.[b.id],
      fresh =
        entry &&
        entry.latestActionDate >= (b.congressData?.latestActionDate || "");
    return {
      ...b,
      stage: legislativeStage([...(entry?.actions || []), { text: b.action }]),
      lastActionDate:
        [
          b.congressData?.latestActionDate,
          entry?.latestActionDate,
          b.action.match(/\((\d{4}-\d{2}-\d{2})\)\s*$/)?.[1],
        ]
          .filter(Boolean)
          .sort()
          .at(-1) || b.introduced,
      actionHistory: entry?.actions || [],
      statusCheckedAt: fresh ? entry.checkedAt : null,
    };
  });
}
const keys = [
  "q",
  "chamber",
  "topic",
  "engagement",
  "sort",
  "size",
  "status",
  "recent",
  "month",
  "sponsor",
  "party",
  "band",
  "companion",
  "pair",
  "primaryOnly",
  "view",
  "gap",
  "returnChart",
  "returnChamber",
];
export const sortOptions = [
  ["bill-number", "Bill number"],
  ["cosponsors", "Cosponsors: most first"],
  ["newest", "Introduction date: newest to oldest"],
  ["oldest", "Introduction date: oldest to newest"],
  ["activity", "Last action: newest to oldest"],
  ["title", "Title: A–Z"],
];
const allowedSorts = sortOptions.map(([value]) => value);
export function trackerHash(filters = {}, page = 1) {
  const p = new URLSearchParams();
  for (const key of keys) {
    const v = filters[key];
    if (
      v &&
      !(key === "sort" && v === "bill-number") &&
      !(key === "size" && String(v) === "25") &&
      !(key === "view" && v === "bills")
    )
      p.set(key, String(v));
  }
  if (page > 1) p.set("page", String(page));
  return "#tracker" + (p.size ? "?" + p : "");
}
export function routeState(hash) {
  const [view, query = ""] = String(hash).replace(/^#/, "").split("?"),
    p = new URLSearchParams(query);
  if (["changelog", "history"].includes(view))
    return { view: "changelog", filters: {}, page: 1 };
  if (["docs", "documentation", "methodology"].includes(view)) {
    const section = p.get("section");
    return {
      view: "docs",
      ...([
        "overview",
        "updates",
        "scope",
        "focus",
        "engagement",
        "data",
      ].includes(section)
        ? { section }
        : {}),
    };
  }
  if (["trends", "patterns", "charts"].includes(view))
    return readPatternsHash(hash);
  const filters = {};
  for (const key of keys) if (p.has(key)) filters[key] = p.get(key);
  if (!["House", "Senate"].includes(filters.chamber)) delete filters.chamber;
  if (filters.sort && !allowedSorts.includes(filters.sort)) delete filters.sort;
  if (filters.status && !stages.includes(filters.status)) delete filters.status;
  if (!["25", "50", "all"].includes(filters.size)) delete filters.size;
  if (!["bills", "families"].includes(filters.view)) delete filters.view;
  return {
    view: "tracker",
    filters,
    page: Math.max(1, Math.min(10000, Number(p.get("page")) || 1)),
  };
}
export function matchingBills(bills, filters = {}, today = new Date()) {
  const now = Date.parse(
    today.toLocaleDateString("en-CA", { timeZone: "America/New_York" }) +
      "T00:00:00Z",
  );
  return filterBills(bills, filters).filter((b) => {
    if (filters.primaryOnly && filters.topic && b.primary !== filters.topic)
      return false;
    if (filters.status && b.stage !== filters.status) return false;
    if (filters.month && b.introduced.slice(0, 7) !== filters.month)
      return false;
    if (
      filters.sponsor &&
      !String(b.sponsor)
        .split(/;\s*|\r?\n/)
        .includes(filters.sponsor)
    )
      return false;
    if (filters.party && !(b.sponsor || "").includes("(" + filters.party + "-"))
      return false;
    if (filters.recent) {
      const age =
        (now - Date.parse(b.lastActionDate + "T00:00:00Z")) / 86400000;
      if (!Number.isFinite(age) || age < 0 || age > Number(filters.recent))
        return false;
    }
    if (filters.companion === "yes" && !b.companions?.length) return false;
    if (filters.companion === "no" && b.companions?.length) return false;
    if (filters.pair) {
      let pair;
      try {
        pair = JSON.parse(filters.pair);
      } catch {
        return false;
      }
      if (
        !Array.isArray(pair) ||
        pair.length !== 2 ||
        [b.primary, b.secondary].sort().join("|") !== pair.sort().join("|")
      )
        return false;
    }
    if (filters.band) {
      const n = Number(b.cosponsorCount),
        range = {
          0: [0, 0],
          "1–4": [1, 4],
          "5–9": [5, 9],
          "10–24": [10, 24],
          "25–49": [25, 49],
          "50+": [50, Infinity],
        }[filters.band];
      if (!range || n < range[0] || n > range[1]) return false;
    }
    return true;
  });
}
export function sortedBills(rows, sort = "bill-number") {
  return [...rows].sort((a, b) =>
    sort === "newest"
      ? b.introduced.localeCompare(a.introduced) ||
        a.id.localeCompare(b.id, "en", { numeric: true })
      : sort === "oldest"
        ? a.introduced.localeCompare(b.introduced) ||
          a.id.localeCompare(b.id, "en", { numeric: true })
        : sort === "title"
          ? a.title.localeCompare(b.title)
          : sort === "cosponsors"
            ? Number(b.cosponsorCount) - Number(a.cosponsorCount) ||
              a.id.localeCompare(b.id, "en", { numeric: true })
            : sort === "activity"
              ? b.lastActionDate.localeCompare(a.lastActionDate) ||
                a.id.localeCompare(b.id, "en", { numeric: true })
              : a.id.localeCompare(b.id, "en", { numeric: true }),
  );
}
export function familyMatches(family, matchingIds, gap = "") {
  if (!family.ids.some((id) => matchingIds.has(id))) return false;
  const ranges = {
    "Same day": [0, 0],
    "1–7 days": [1, 7],
    "8–30 days": [8, 30],
    "31–90 days": [31, 90],
    "91–180 days": [91, 180],
    "181+ days": [181, Infinity],
  };
  const range = ranges[gap];
  return (
    !gap || Boolean(range && family.gap >= range[0] && family.gap <= range[1])
  );
}

export function patternsHash(chamber = "", chart = "") {
  const params = new URLSearchParams();
  if (["House", "Senate"].includes(chamber)) params.set("chamber", chamber);
  if (chart && /^[a-z-]+$/.test(chart)) params.set("chart", chart);
  return "#trends" + (params.size ? "?" + params : "");
}
export function readPatternsHash(hash) {
  const [view, query = ""] = hash.replace(/^#/, "").split("?"),
    params = new URLSearchParams(query);
  return {
    view: ["trends", "patterns", "charts"].includes(view)
      ? "charts"
      : "tracker",
    chamber: ["House", "Senate"].includes(params.get("chamber"))
      ? params.get("chamber")
      : "",
    chart: params.get("chart") || "",
  };
}

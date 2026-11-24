import { csvRows } from "./format.js";
export function normalize(rows) {
  const map = new Map();
  for (const source of rows) {
    const b = Object.fromEntries(
      Object.entries(source).map(([k, v]) => [
        k,
        typeof v === "string" ? v.trim() : v,
      ]),
    );
    if (!map.has(b.id)) map.set(b.id, { ...b, variants: [] });
    map.get(b.id).variants.push(source);
  }
  return [...map.values()];
}
export function filterBills(
  bills,
  { q = "", chamber = "", topic = "", engagement = "" } = {},
) {
  return bills.filter(
    (b) =>
      (!q ||
        [
          b.id,
          b.title,
          b.originalTitle,
          b.sponsor,
          b.summary,
          b.primary,
          b.secondary,
          b.cosponsors,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (!chamber || b.chamber === chamber) &&
      (!topic || b.primary === topic || b.secondary === topic) &&
      (!engagement ||
        (engagement === "recorded"
          ? !!b.engagement
          : engagement === "unrecorded"
            ? !b.engagement
            : engagement === "endorsed"
              ? engagementKind(b.engagement) === "endorsed"
              : engagementKind(b.engagement) === "engaged")),
  );
}
export function topicCounts(bills) {
  return Object.entries(
    bills.reduce((a, b) => ((a[b.primary] = (a[b.primary] || 0) + 1), a), {}),
  ).sort((a, b) => b[1] - a[1]);
}
export function csv(
  rows,
  keys = [
    "id",
    "title",
    "chamber",
    "primary",
    "secondary",
    "sponsor",
    "cosponsors",
    "cosponsorCount",
    "introduced",
    "action",
    "summary",
    "engagement",
  ],
) {
  return csvRows([keys, ...rows.map((b) => keys.map((k) => b[k]))]);
}

export function engagementKind(value = "") {
  const text = String(value).toLowerCase();
  return text === "endorsed."
    ? "endorsed"
    : text.startsWith("engaged,")
      ? "engaged"
      : "unrecorded";
}

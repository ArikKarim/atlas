import { engagementKind } from "./model.js";
export function leadSponsorRankings(bills) {
  const counts = { House: new Map(), Senate: new Map() };
  for (const bill of bills) {
    if (!counts[bill.chamber]) continue;
    for (const name of new Set(
      String(bill.sponsor || "")
        .split(/;\s*|\r?\n/)
        .map((x) => x.trim())
        .filter((x) => x && x !== "N/A"),
    )) {
      const chamber = counts[bill.chamber];
      chamber.set(name, (chamber.get(name) || 0) + 1);
    }
  }
  return Object.fromEntries(
    Object.entries(counts).map(([chamber, people]) => [
      chamber,
      [...people]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    ]),
  );
}
export function summarize(bills, chamber = "") {
  const rows = bills.filter((b) => !chamber || b.chamber === chamber);
  const topics = new Map(),
    months = new Map(),
    pairs = new Map();
  const cosponsorBands = [
    { label: "0", min: 0, max: 0, House: 0, Senate: 0 },
    { label: "1–4", min: 1, max: 4, House: 0, Senate: 0 },
    { label: "5–9", min: 5, max: 9, House: 0, Senate: 0 },
    { label: "10–24", min: 10, max: 24, House: 0, Senate: 0 },
    { label: "25–49", min: 25, max: 49, House: 0, Senate: 0 },
    { label: "50+", min: 50, max: Infinity, House: 0, Senate: 0 },
  ];
  for (let year = 2025; year <= 2026; year++)
    for (let month = 1; month <= 12; month++)
      months.set(`${year}-${String(month).padStart(2, "0")}`, {
        House: 0,
        Senate: 0,
      });
  const engagement = { endorsed: 0, engaged: 0, unrecorded: 0 };
  for (const b of rows) {
    if (!topics.has(b.primary))
      topics.set(b.primary, { House: 0, Senate: 0, endorsed: 0, engaged: 0 });
    topics.get(b.primary)[b.chamber]++;
    const month = months.get(b.introduced.slice(0, 7));
    if (month) month[b.chamber]++;
    const note = engagementKind(b.engagement);
    if (note === "endorsed") {
      engagement.endorsed++;
      topics.get(b.primary).endorsed++;
    } else if (note === "engaged") {
      engagement.engaged++;
      topics.get(b.primary).engaged++;
    } else engagement.unrecorded++;
    const count = Number(b.cosponsorCount);
    if (b.cosponsorCount !== "" && Number.isFinite(count) && count >= 0) {
      const band = cosponsorBands.find((x) => count >= x.min && count <= x.max);
      if (band) band[b.chamber]++;
    }
    if (
      b.primary &&
      b.secondary &&
      b.primary !== "N/A" &&
      b.secondary !== "N/A" &&
      b.primary !== b.secondary
    ) {
      const names = [b.primary, b.secondary].sort();
      const key = JSON.stringify(names);
      if (!pairs.has(key)) pairs.set(key, { names, House: 0, Senate: 0 });
      pairs.get(key)[b.chamber]++;
    }
  }
  return {
    rows,
    engagement,
    pairs: [...pairs.values()]
      .map((x) => ({ ...x, total: x.House + x.Senate }))
      .sort(
        (a, b) =>
          b.total - a.total || a.names.join().localeCompare(b.names.join()),
      ),
    cosponsorBands: cosponsorBands.map(({ label, House, Senate }) => ({
      label,
      House,
      Senate,
      total: House + Senate,
    })),
    topics: [...topics]
      .map(([name, counts]) => ({
        name,
        ...counts,
        total: counts.House + counts.Senate,
      }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
    months: [...months].map(([month, counts]) => ({
      month,
      ...counts,
      total: counts.House + counts.Senate,
    })),
    topCosponsors: [...rows]
      .sort(
        (a, b) =>
          Number(b.cosponsorCount) - Number(a.cosponsorCount) ||
          a.id.localeCompare(b.id),
      )
      .slice(0, 10),
  };
}

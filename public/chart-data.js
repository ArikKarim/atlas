import { companionStats } from "./companions.js";
import { summarize, leadSponsorRankings } from "./charts.js";
const chamberSeries = [
  { label: "House", color: "#3974ad" },
  { label: "Senate", color: "#a765a5" },
];
const statusSeries = [
  { label: "Endorsed", color: "#6baf81" },
  { label: "Engaged, not endorsed", color: "#d8b75a" },
];
export function chartContext(bills, chamber = "") {
  return {
    companions: companionStats(bills, chamber),
    data: summarize(bills, chamber),
    rankings: leadSponsorRankings(bills),
  };
}
export function chartSpecs(
  bills,
  chamber = "",
  context = chartContext(bills, chamber),
) {
  const { companions, data, rankings } = context,
    scope = chamber || "House and Senate";
  const spec = (id, title, note, series, rows, extra = {}) => ({
    id,
    title,
    note,
    scope,
    kind: "bar",
    series,
    rows,
    ...extra,
  });
  const paired = (items) =>
    items.map((x) => ({ label: x.name, values: [x.House, x.Senate] }));
  const engaged = data.topics
    .filter((t) => t.endorsed + t.engaged > 0)
    .sort(
      (a, b) =>
        b.endorsed + b.engaged - (a.endorsed + a.engaged) ||
        a.name.localeCompare(b.name),
    );
  return [
    spec(
      "companion-coverage",
      "House–Senate companion coverage",
      "",
      chamberSeries,
      companions.coverage.map((r) => ({
        label: r.label,
        values: [r.House, r.Senate],
      })),
    ),
    spec(
      "companion-gaps",
      "Companion introduction gaps",
      "",
      [{ label: "Bill families", color: "#64748b" }],
      companions.bands.map((b) => ({ label: b.label, values: [b.count] })),
      { unit: "Bill families", scope: "House and Senate" },
    ),
    spec(
      "monthly-introductions",
      "Bill introductions by month",
      "",
      chamberSeries,
      data.months.map((m) => ({ label: m.month, values: [m.House, m.Senate] })),
      { kind: "monthly" },
    ),
    spec(
      "focus-areas",
      "Top 10 focus areas by bill count",
      "",
      chamberSeries,
      paired(data.topics.slice(0, 10)),
    ),
    ...(chamber ? [chamber] : ["House", "Senate"]).map((c) =>
      spec(
        c.toLowerCase() + "-sponsors",
        "Top 10 leading " + c + " sponsors",
        "",
        chamberSeries.filter((s) => s.label === c),
        rankings[c]
          .slice(0, 10)
          .map((p) => ({ label: p.name, values: [p.count] })),
        {
          max: Math.max(
            1,
            ...Object.values(rankings)
              .flat()
              .map((p) => p.count),
          ),
          unit: "Bills led",
          scope: c,
        },
      ),
    ),
    spec(
      "policy-overlap",
      "Top 8 primary–secondary focus-area pairs",
      "",
      chamberSeries,
      data.pairs
        .slice(0, 8)
        .map((p) => ({
          label: p.names.join(" + "),
          values: [p.House, p.Senate],
        })),
    ),
    spec(
      "engagement-by-area",
      "SIIA engagement across policy areas",
      "",
      statusSeries,
      engaged.map((t) => ({
        label: t.name,
        values: [t.endorsed, t.engaged],
        denominator: t.total,
        display: `${t.endorsed + t.engaged} / ${t.total} (${Math.round(((t.endorsed + t.engaged) / t.total) * 100)}%)`,
      })),
      { percentage: true, max: 100, unit: "Share of tracked bills" },
    ),
    spec(
      "cosponsor-distribution",
      "Cosponsor distribution",
      "",
      chamberSeries,
      data.cosponsorBands.map((b) => ({
        label: b.label + " cosponsors",
        values: [b.House, b.Senate],
      })),
    ),
    spec(
      "most-cosponsors",
      "Top 10 bills by cosponsor count",
      "",
      [{ label: "Cosponsors", color: "#3974ad" }],
      data.topCosponsors.map((b) => ({
        label: b.id + " · " + b.title,
        values: [Number(b.cosponsorCount)],
      })),
      { unit: "Cosponsors" },
    ),
    ...(!chamber
      ? [
          spec(
            "sponsor-party",
            "Lead sponsor party by chamber",
            "",
            chamberSeries,
            ["Democratic", "Republican", "Independent", "Other / unspecified"]
              .map((label, i) => ({
                label,
                values: ["House", "Senate"].map(
                  (c) =>
                    bills.filter(
                      (b) =>
                        b.chamber === c &&
                        ({ D: 0, R: 1, I: 2 }[
                          String(b.sponsor).match(/\(([DRI])-/)?.[1]
                        ] ?? 3) === i,
                    ).length,
                ),
              }))
              .filter((r) => r.values.some(Boolean)),
          ),
        ]
      : []),
    spec(
      "siia-engagement",
      "SIIA engagement",
      "",
      [{ label: "Bills", color: "#64748b" }],
      [
        {
          label: "Endorsed",
          values: [data.engagement.endorsed],
          color: "#6baf81",
        },
        {
          label: "Engaged, not endorsed",
          values: [data.engagement.engaged],
          color: "#d8b75a",
        },
        {
          label: "No engagement recorded",
          values: [data.engagement.unrecorded],
          color: "#a3abb4",
        },
      ],
    ),
  ];
}

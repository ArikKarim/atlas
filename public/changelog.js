import { escapeHtml as esc, reviewedDate } from "./format.js";
import { referenceSection } from "./reference.js";
const day = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : new Date(value).toLocaleDateString("en-CA", {
        timeZone: "America/New_York",
      });
const label = (value) =>
  new Date(value + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
export function changelogPage({
  research,
  snapshot,
  officialChanges,
  releases = [],
}) {
  const entries = [
    ...releases,
    ...(research?.events || []).map((event) => ({
      date: day(event.date),
      title:
        event.kind === "Classification"
          ? "Focus areas reviewed"
          : event.kind === "Summary maintenance"
            ? "Summaries simplified"
            : event.title,
      description:
        event.kind === "Summary maintenance"
          ? `Cleaned up ${event.changes.length} summaries by moving companion references and procedural details into their dedicated fields.`
          : event.description,
    })),
    ...(officialChanges?.events || []).map((event) => ({
      date: day(event.date),
      title: "Bill records updated",
      description: `Refreshed official information for ${event.changes.length} ${event.changes.length === 1 ? "bill" : "bills"}.`,
    })),
  ];
  const groups = new Map();
  for (const entry of entries.sort((a, b) =>
    day(b.date).localeCompare(day(a.date)),
  )) {
    const date = day(entry.date);
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(entry);
  }
  return `<section class="page-heading changelog-heading"><h1 id="changelog-title">Changelog</h1></section><div class="changelog">${[...groups].map(([date, items]) => referenceSection({ id: "changelog-" + date, title: label(date), className: "changelog-day", body: `<ul>${items.map((item) => `<li><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></li>`).join("")}</ul>` })).join("")}<p class="changelog-refresh">Official data last refreshed ${reviewedDate(snapshot?.checkedAt)}.</p></div>`;
}

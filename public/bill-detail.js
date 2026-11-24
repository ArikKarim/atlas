import {
  escapeHtml as esc,
  formatDate as date,
  reviewedDate,
} from "./format.js";
import { engagementContext } from "./engagement.js";
export function billDetails(b, research, badge) {
  const focusChange = research.events
    ?.filter((e) => e.kind === "Classification")
    .flatMap((e) => e.changes || [])
    .findLast((c) => c.id === b.id);
  return `<span class="eyebrow">119th Congress · ${b.chamber}</span><h2>${esc(b.title)}</h2><p><span class="bill-id">${esc(b.id)}</span> &nbsp; ${badge(b)}</p>${engagementContext(b) ? `<p class="small-note">${esc(engagementContext(b))}</p>` : ""}<dl><dt>Status</dt><dd>${esc(b.stage)}</dd><dt>Last action date</dt><dd>${date(b.lastActionDate)}</dd><dt>Primary focus</dt><dd>${esc(b.primary)}</dd><dt>Secondary focus</dt><dd>${esc(b.secondary) || "Not recorded"}</dd><dt>Lead sponsors</dt><dd>${esc(b.sponsor)}</dd><dt>Cosponsors (${esc(b.cosponsorCount)})</dt><dd>${esc(b.cosponsors) || (Number(b.cosponsorCount) === 0 ? "None" : "Not recorded")}</dd><dt>Introduction date</dt><dd>${date(b.introduced)}</dd>${b.congressData ? `<dt>Congress.gov checked</dt><dd>${new Date(b.congressData.verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</dd>` : ""}</dl>${b.companions?.length ? `<h3>Companion bills</h3><p>${b.companions.map((c) => `<button class="bill-number" data-bill="${esc(c.id)}">${esc(c.id)}</button>`).join(" · ")}</p>` : ""}<h3>Latest recorded action</h3><p>${esc(b.action) || "Not recorded"}</p><h3>Summary</h3><p>${esc(b.summary) || "Not recorded"}</p><details class="bill-research"><summary>Sources and research reviews</summary><dl><dt>Focus-area review</dt><dd>${reviewedDate(research.focusReviewedAt)}</dd>${research.summaryReviewedAt?.[b.id] ? `<dt>Summary maintenance</dt><dd>${reviewedDate(research.summaryReviewedAt[b.id])}</dd>` : ""}<dt>Classification</dt><dd>Editorial research</dd><dt>Official facts</dt><dd>Congress.gov</dd></dl><p>${esc(research.definitions?.[b.primary] || "")}</p>${focusChange ? `<p>${esc(focusChange.reason)}</p>` : ""}<button class="text-button" data-view-link="changelog">View changelog</button></details>${
    b.actionHistory?.length
      ? `<details><summary>Official action history (${b.actionHistory.length})</summary><ol class="action-history">${[
          ...b.actionHistory,
        ]
          .reverse()
          .map(
            (a) => `<li><time>${date(a.date)}</time><p>${esc(a.text)}</p></li>`,
          )
          .join("")}</ol></details>`
      : ""
  }<p><a class="textlink" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">View on Congress.gov</a></p>`;
}

import { escapeHtml as esc } from "./format.js";
import { scopeMarkup, candidateReviewSteps } from "./scope.js";

export const docsSections = [
  ["overview", "What is Atlas?"],
  ["updates", "How updates work"],
  ["scope", "Inclusion criteria"],
  ["focus", "Focus areas"],
  ["engagement", "SIIA engagement"],
  ["data", "Sources and counting"],
];

export function docsPage({ research = {} } = {}) {
  return `<section class="page-heading docs-heading"><h1>Documentation</h1><p>A guide to Atlas, its data, and the decisions behind the tracker.</p></section>
  <div class="docs-layout"><nav class="docs-nav" aria-label="Documentation sections"><span class="docs-nav-label">Sections</span><div class="docs-nav-list">${docsSections.map(([id, title]) => `<a href="#docs?section=${id}" data-doc-link="${id}">${esc(title)}</a>`).join("")}</div></nav><div class="docs-content">
  <section id="docs-overview" data-doc-section="overview"><h2>What is Atlas?</h2><p>Atlas is an AI policy tracker for the 119th Congress. It brings official legislative records, policy classifications, and documented Software &amp; Information Industry Association (SIIA) engagement into one searchable view.</p><div class="docs-features"><div><h3>Tracker</h3><p>Search and filter bills, read summaries, compare companions, and follow official actions.</p></div><div><h3>Trends</h3><p>Explore patterns in policy topics, sponsorship, introductions, and SIIA engagement.</p></div><div><h3>Sharing</h3><p>Share filtered views or export charts as PNG, SVG, and CSV.</p></div></div></section>
  <section id="docs-updates" data-doc-section="updates"><h2>How updates work</h2><p>Official facts refresh automatically. Research decisions follow a separate review process.</p><div class="docs-update-list"><div><h3>Congress.gov API</h3><p>Scheduled GitHub Actions workflows refresh titles, sponsors, active cosponsors, dates, and legislative actions daily. Records are matched by Congress, bill type, number, and title before updates are applied.</p></div><div><h3>Research review</h3><p>Candidate inclusion, summaries, focus areas, and SIIA engagement are reviewed separately. Official-data refreshes preserve these editorial fields; candidate discovery does not automatically add bills.</p></div><div><h3>Codex agents and validation</h3><p>Codex agents assist with site maintenance, source checks, classification reviews, and testing. Updates are checked before publication, including whether chart selections and exports match the Tracker data.</p></div></div><p class="docs-secondary">Bill details show when official facts were checked. The footer’s Changelog records major site and research updates.</p></section>
  <section id="docs-scope" data-doc-section="scope"><h2>Inclusion criteria</h2><p>Atlas covers introduced House and Senate bills in the 119th Congress (2025–2026), including direct AI policy and selected adjacent technology policy. SIIA engagement is not required for inclusion.</p>${scopeMarkup()}<details class="docs-disclosure"><summary>How candidates are reviewed</summary><ol>${candidateReviewSteps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol><p>Discovery groups and keyword matches are leads, not inclusion decisions. Each related or companion bill is reviewed independently.</p></details></section>
  <section id="docs-focus" data-doc-section="focus"><h2>Focus areas</h2><p>Focus areas are topic labels that make bills easier to filter and compare. They describe the main policy questions a bill addresses and are separate from Congress.gov’s subject tags.</p><div class="docs-focus-labels"><div><h3>Primary focus</h3><p>The bill’s main policy subject and operative mechanism. Each bill has one primary focus area.</p></div><div><h3>Secondary focus</h3><p>One distinct, substantial additional subject. This label is optional.</p></div></div><div class="docs-example"><h3>Example: semiconductor export restrictions</h3><p><strong>Primary:</strong> Trade &amp; Export Controls<br><strong>Secondary:</strong> Semiconductors &amp; Advanced Tech</p></div><h3>How labels are assigned</h3><ul><li>Review official bill text and available Congressional Research Service (CRS) summaries, rather than relying on a nickname or committee referral.</li><li>Choose the strongest policy subject; add a secondary label only for a material additional subject.</li><li>Keep companion labels consistent when provisions match. Record sources and reasons for changes, and revisit labels after material amendments.</li></ul><details class="docs-disclosure docs-definitions"><summary>Browse focus-area definitions</summary><dl>${Object.entries(
    research.definitions || {},
  )
    .map(
      ([title, text]) =>
        `<div><dt>${esc(title)}</dt><dd>${esc(text)}</dd></div>`,
    )
    .join("")}</dl></details></section>
  <section id="docs-engagement" data-doc-section="engagement"><h2>SIIA engagement</h2><p>Engagement labels describe documented SIIA activity on a particular bill. They are separate from the bill’s scope, focus areas, and legislative status.</p><div class="docs-engagement"><h3><span class="tag green">Endorsed</span></h3><p>SIIA has expressly supported the bill, its passage, or its enactment in a letter, statement, or other documented policy material.</p></div><div class="docs-engagement"><h3><span class="tag amber">Engaged, not endorsed</span></h3><p>SIIA has engaged on the bill without established support for it as a whole. Activity can include analysis, recommendations, proposed changes, criticism, or opposition. This label does not imply support.</p></div><p><strong>No engagement recorded</strong> means no verified engagement record is available in Atlas’s sources. Labels link to public SIIA material when available and are checked separately for each bill version.</p></section>
  <section id="docs-data" data-doc-section="data"><h2>Sources and counting</h2><dl class="docs-facts"><div><dt>Official sources</dt><dd>Congress.gov supplies legislative facts and action histories. GovInfo provides official bill text. SIIA materials support engagement labels.</dd></div><div><dt>Bill counts</dt><dd>Each House or Senate bill counts once. Companion charts group related versions; each version retains its own sponsor, status, and engagement record.</dd></div><div><dt>Focus-area counts</dt><dd>The Trends focus-area chart uses primary labels. Tracker filters can match either primary or secondary labels. A primary–secondary pair counts once per bill.</dd></div><div><dt>Charts and exports</dt><dd>Trends uses the published dataset or selected chamber. Shared charts and exported files use the same underlying counts.</dd></div><div><dt>Discovery coverage</dt><dd>Candidate discovery searches titles, available CRS summaries, and related-bill links. It does not search every bill’s full text, so the review queue is not a definitive count of all AI legislation.</dd></div></dl><p class="docs-sources"><a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer">Congress.gov</a><a href="https://www.govinfo.gov/" target="_blank" rel="noopener noreferrer">GovInfo</a><a href="https://www.siia.net/" target="_blank" rel="noopener noreferrer">SIIA</a></p></section>
  </div></div>`;
}

export function activeSectionId(positions, offset = 96, atBottom = false) {
  if (!positions.length) return "";
  if (atBottom) return positions.at(-1).id;
  return (
    positions.filter((section) => section.top <= offset).at(-1)?.id ||
    positions[0].id
  );
}

export function mountDocs(root, initialSection) {
  const nav = root.querySelector(".docs-nav"),
    list = nav.querySelector(".docs-nav-list");
  const sections = [...root.querySelectorAll("[data-doc-section]")];
  const links = [...nav.querySelectorAll("[data-doc-link]")];
  let frame = null,
    current = "";
  const activate = (id) => {
    if (id === current) return;
    current = id;
    for (const link of links) {
      if (link.dataset.docLink === id)
        link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
    if (window.innerWidth <= 760) {
      const link = links.find((link) => link.dataset.docLink === id);
      if (link)
        list.scrollTo({
          left: Math.max(
            0,
            link.offsetLeft - list.clientWidth / 2 + link.offsetWidth / 2,
          ),
          behavior: "smooth",
        });
    }
  };
  const update = () => {
    frame = null;
    activate(
      activeSectionId(
        sections.map((section) => ({
          id: section.dataset.docSection,
          top: section.getBoundingClientRect().top,
        })),
        window.innerWidth <= 760 ? 130 : 96,
        window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 4,
      ),
    );
  };
  const schedule = () => {
    if (frame === null) frame = requestAnimationFrame(update);
  };
  const click = (event) => {
    const link = event.target.closest("[data-doc-link]");
    if (
      !link ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    const id = link.dataset.docLink;
    history.replaceState(null, "", "#docs?section=" + id);
    activate(id);
    root
      .querySelector("#docs-" + id)
      .scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
  };
  nav.addEventListener("click", click);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  const observer = new ResizeObserver(schedule);
  observer.observe(root.querySelector(".docs-content"));
  if (initialSection)
    root
      .querySelector("#docs-" + initialSection)
      ?.scrollIntoView({ block: "start" });
  update();
  return () => {
    nav.removeEventListener("click", click);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    observer.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
  };
}

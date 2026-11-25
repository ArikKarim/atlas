import { escapeHtml as esc } from "./format.js";
import { scopeMarkup, candidateReviewSteps } from "./scope.js";
import { referencePanel } from "./reference.js";

export const docsSections = [
  ["overview", "What is Atlas?"],
  ["updates", "How does Atlas stay up to date?"],
  ["scope", "Which bills are included?"],
  ["focus", "What are focus areas?"],
  ["engagement", "What do SIIA engagement labels mean?"],
  ["data", "Where does the data come from, and how is it counted?"],
];

export function docsPage({ research = {} } = {}) {
  const bodies = [
    `<p>Atlas is an AI policy tracker for the 119th Congress. It brings official legislative records, policy classifications, and documented Software &amp; Information Industry Association (SIIA) engagement into one searchable view.</p><div class="docs-features"><div><h3>Tracker</h3><p>Search and filter bills, read summaries, compare companions, and follow official actions.</p></div><div><h3>Trends</h3><p>Explore patterns in policy topics, sponsorship, introductions, and SIIA engagement.</p></div><div><h3>Sharing</h3><p>Share filtered views or export charts as PNG, SVG, and CSV.</p></div></div>`,
    `<p>Official facts refresh automatically. Research decisions follow a separate review process.</p><div class="reference-table-wrap" role="region" aria-label="Update process" tabindex="0"><table class="reference-table"><thead><tr><th scope="col">Process</th><th scope="col">How it works</th></tr></thead><tbody><tr><th scope="row">Congress.gov API</th><td>Scheduled GitHub Actions workflows refresh titles, sponsors, active cosponsors, dates, and legislative actions daily. Records are matched by Congress, bill type, number, and title before updates are applied.</td></tr><tr><th scope="row">Research review</th><td>Candidate inclusion, summaries, focus areas, and SIIA engagement are reviewed separately. Official-data refreshes preserve these editorial fields; candidate discovery does not automatically add bills.</td></tr><tr><th scope="row">Codex agents and validation</th><td>Codex agents assist with site maintenance, source checks, classification reviews, and testing. Updates are checked before publication, including whether chart selections and exports match the Tracker data.</td></tr></tbody></table></div><p class="docs-note">Bill details show when official facts were checked. The footer’s Changelog records major site and research updates.</p>`,
    `<p>Atlas covers introduced House and Senate bills in the 119th Congress (2025–2026), including direct AI policy and selected adjacent technology policy. SIIA engagement is not required for inclusion.</p>${scopeMarkup()}<details class="reference-disclosure"><summary>3.1. How are candidates reviewed?</summary><ol>${candidateReviewSteps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol><p>Discovery groups and keyword matches are leads, not inclusion decisions. Each related or companion bill is reviewed independently.</p></details>`,
    `<p>Focus areas are topic labels that make bills easier to filter and compare. They describe the main policy questions a bill addresses and are separate from Congress.gov’s subject tags.</p><div class="reference-table-wrap" role="region" aria-label="Focus-area labels" tabindex="0"><table class="reference-table"><thead><tr><th scope="col">Label</th><th scope="col">Meaning</th></tr></thead><tbody><tr><th scope="row">Primary focus</th><td>The bill’s main policy subject and operative mechanism. Each bill has one primary focus area.</td></tr><tr><th scope="row">Secondary focus</th><td>One distinct, substantial additional subject. This label is optional.</td></tr></tbody></table></div><div class="docs-example"><h3>Example: semiconductor export restrictions</h3><p><strong>Primary:</strong> Trade &amp; Export Controls<br><strong>Secondary:</strong> Semiconductors &amp; Advanced Tech</p></div><details class="reference-disclosure"><summary>4.1. How are labels assigned?</summary><ul><li>Review official bill text and available Congressional Research Service (CRS) summaries, rather than relying on a nickname or committee referral.</li><li>Choose the strongest policy subject; add a secondary label only for a material additional subject.</li><li>Keep companion labels consistent when provisions match. Record sources and reasons for changes, and revisit labels after material amendments.</li></ul></details><details class="reference-disclosure docs-definitions"><summary>4.2. What does each focus area cover?</summary><div class="reference-table-wrap" role="region" aria-label="Focus-area definitions" tabindex="0"><table class="reference-table"><thead><tr><th scope="col">Focus area</th><th scope="col">Definition</th></tr></thead><tbody>${Object.entries(
      research.definitions || {},
    )
      .map(
        ([title, text]) =>
          `<tr><th scope="row">${esc(title)}</th><td>${esc(text)}</td></tr>`,
      )
      .join("")}</tbody></table></div></details>`,
    `<p>Engagement labels describe documented SIIA activity on a particular bill. They are separate from the bill’s scope, focus areas, and legislative status.</p><div class="reference-table-wrap" role="region" aria-label="SIIA engagement labels" tabindex="0"><table class="reference-table"><thead><tr><th scope="col">Label</th><th scope="col">Meaning</th></tr></thead><tbody><tr><th scope="row"><span class="tag green">Endorsed</span></th><td>SIIA has expressly supported the bill, its passage, or its enactment in a letter, statement, or other documented policy material.</td></tr><tr><th scope="row"><span class="tag amber">Engaged, not endorsed</span></th><td>SIIA has engaged on the bill without established support for it as a whole. Activity can include analysis, recommendations, proposed changes, criticism, or opposition. This label does not imply support.</td></tr></tbody></table></div><p><strong>No engagement recorded</strong> means no verified engagement record is available in Atlas’s sources. Labels link to public SIIA material when available and are checked separately for each bill version.</p>`,
    `<div class="reference-table-wrap" role="region" aria-label="Sources and counting" tabindex="0"><table class="reference-table"><thead><tr><th scope="col">Topic</th><th scope="col">Source or rule</th></tr></thead><tbody><tr><th scope="row">Official sources</th><td>Congress.gov supplies legislative facts and action histories. GovInfo provides official bill text. SIIA materials support engagement labels.</td></tr><tr><th scope="row">Bill counts</th><td>Each House or Senate bill counts once. Companion charts group related versions; each version retains its own sponsor, status, and engagement record.</td></tr><tr><th scope="row">Focus-area counts</th><td>The Trends focus-area chart uses primary labels. Tracker filters can match either primary or secondary labels. A primary–secondary pair counts once per bill.</td></tr><tr><th scope="row">Charts and exports</th><td>Trends uses the published dataset or selected chamber. Shared charts and exported files use the same underlying counts.</td></tr><tr><th scope="row">Discovery coverage</th><td>Candidate discovery searches titles, available CRS summaries, and related-bill links. It does not search every bill’s full text, so the review queue is not a definitive count of all AI legislation.</td></tr></tbody></table></div><p class="docs-sources"><a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer">Congress.gov</a><a href="https://www.govinfo.gov/" target="_blank" rel="noopener noreferrer">GovInfo</a><a href="https://www.siia.net/" target="_blank" rel="noopener noreferrer">SIIA</a></p>`,
  ];
  return `<section class="page-heading docs-heading"><h1>Documentation</h1></section><div class="docs-layout"><nav class="docs-nav" aria-label="Documentation sections"><span class="docs-nav-label">Questions</span><div class="docs-nav-list">${docsSections.map(([id, title], index) => `<a href="#docs?section=${id}" data-doc-link="${id}"><span class="docs-question-number">${index + 1}.</span><span>${esc(title)}</span></a>`).join("")}</div></nav><div class="docs-content">${docsSections.map(([id, title], index) => referencePanel({ id: "docs-" + id, title: index + 1 + ". " + title, body: bodies[index], open: index === 0, attributes: 'data-doc-section="' + id + '"', className: "docs-question" })).join("")}</div></div>`;
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
    const target = root.querySelector("#docs-" + id);
    target.open = true;
    target.scrollIntoView({
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
  if (initialSection) {
    const target = root.querySelector("#docs-" + initialSection);
    if (target) {
      target.open = true;
      target.scrollIntoView({ block: "start" });
    }
  }
  update();
  return () => {
    nav.removeEventListener("click", click);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    observer.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
  };
}

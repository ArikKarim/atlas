import { escapeHtml as esc } from "./format.js";

// The published methodology and candidate-review page use the same scope rules.
export const scopeCriteria = [
  {
    title: "Direct AI policy",
    text: "Include bills that materially govern, fund, develop, or deploy AI, automated decision systems, or AI-generated content. This includes model safety, accountability, public-sector use, sector-specific applications, workforce and education, and rights affected by AI.",
  },
  {
    title: "AI-enabling technology and infrastructure",
    text: "Include bills with a material connection to AI computing or deployment, such as data centers, related electricity or water demand, advanced semiconductors, and controls on access to AI chips or computing. Explain that connection in the review note; a generic energy or technology reference is not enough.",
  },
  {
    title: "Broader policy context",
    text: "Selected privacy, cybersecurity, competition, quantum, intellectual-property, and other digital-policy bills may be included when their relevance to the fellowship’s AI and technology policy work is explicitly documented. Treat these as context, rather than assuming every bill in those subjects is an AI bill.",
  },
  {
    title: "Outside the scope",
    text: "Exclude incidental mentions, acronym matches, and broad technology or infrastructure bills without a supported policy connection. Keep unresolved cases deferred. Atlas tracks introduced House and Senate bills in the 119th Congress; drafts, other Congresses, and non-bill measures do not enter this dataset.",
  },
];

export const candidateReviewSteps = [
  "Confirm the Congress, chamber, bill number, and official title. Check whether that bill is already tracked.",
  "Read the relevant operative provisions and available CRS summary. Identify the scope category and the substantive AI or technology-policy connection.",
  "Record the scope category, an official source, and a short relevance rationale in the review note. Broader context needs a specific explanation of why it belongs.",
  "Choose Include, Exclude, or Defer. Before an included candidate is published, complete its official facts, research summary, focus areas, and a separate check of SIIA engagement.",
];

export const methodologySections = [
  ["scope", "Inclusion criteria"],
  ["focus", "Focus areas"],
  ["engagement", "SIIA engagement"],
  ["data", "Sources and counting"],
];

export function scopeMarkup() {
  return `<dl class="scope-rules">${scopeCriteria.map((rule) => `<div><dt>${esc(rule.title)}</dt><dd>${esc(rule.text)}</dd></div>`).join("")}</dl>`;
}

export function methodologyPage({ research = {} } = {}) {
  return `<section class="page-heading methodology-heading"><h1>Methodology</h1><p>How I decide what belongs in Atlas, classify bills, and document SIIA engagement.</p></section>
  <div class="methodology-layout"><nav class="methodology-nav" aria-label="Methodology sections">${methodologySections.map(([id, title]) => `<a href="#methodology?section=${id}">${esc(title)}</a>`).join("")}</nav><div class="methodology-content">
  <section id="method-scope"><h2>Which bills belong in Atlas?</h2><p>Atlas covers AI legislation and selected adjacent technology policy in the 119th Congress. The original SIIA fellowship spreadsheet is the starting point; new candidates are assessed using the same scope rules. A bill does not need SIIA engagement to qualify.</p>${scopeMarkup()}
  <h3>How candidate review works</h3><ol>${candidateReviewSteps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol><p>The review groups and keyword matches are discovery clues, not inclusion decisions. A related or companion bill still needs its own review. Marking Include in candidate review does not automatically add a bill to the published Tracker.</p></section>
  <section id="method-focus"><h2>How are focus areas assigned?</h2><p>I review the official bill text and available CRS summaries, then use the bill’s main policy subject and operative mechanism to choose a <strong>primary focus area</strong>. The bill’s nickname, sponsor, or committee referral alone does not determine its label.</p><p>A <strong>secondary focus area</strong> identifies one distinct, substantial additional subject. It is optional; an incidental reference or routine reporting requirement does not need another label. For example, a bill coordinating semiconductor export restrictions is primarily Trade &amp; Export Controls, with Semiconductors &amp; Advanced Tech as its secondary focus.</p><p>Companion versions receive consistent labels when their relevant provisions match. Classifications are editorial judgments, separate from Congress.gov’s subject tags. I record sources and reasons for changes and revisit labels when amendments materially change a bill.</p><details class="methodology-definitions"><summary>Focus-area definitions</summary><dl>${Object.entries(
    research.definitions || {},
  )
    .map(
      ([title, text]) =>
        `<div><dt>${esc(title)}</dt><dd>${esc(text)}</dd></div>`,
    )
    .join("")}</dl></details></section>
  <section id="method-engagement"><h2>What do the SIIA engagement labels mean?</h2><div class="engagement-definition"><h3><span class="tag green">Endorsed</span></h3><p>SIIA has expressly supported the bill, its passage, or its enactment in a letter, statement, or other documented policy material.</p></div><div class="engagement-definition"><h3><span class="tag amber">Engaged, not endorsed</span></h3><p>SIIA has documented bill-specific engagement, but support for the bill as a whole has not been established. This can include analysis, recommendations, proposed changes, criticism, or opposition. The label does not imply support.</p></div><p><strong>No engagement recorded</strong> means Atlas has no verified engagement record in its sources. Labels link to supporting public SIIA material when available. Engagement is checked separately for each bill version and is not inherited from a companion.</p></section>
  <section id="method-data"><h2>How do sources and counts work?</h2><dl class="methodology-facts"><div><dt>Official facts</dt><dd>Congress.gov supplies bill titles, sponsors, active cosponsor counts, introduction dates, and legislative actions. Records are matched by Congress, bill type, number, and title before official updates are applied.</dd></div><div><dt>Research</dt><dd>Bill summaries, focus areas, and engagement labels are reviewed editorially. Automated official-data refreshes do not decide scope or overwrite this research.</dd></div><div><dt>Bill versions</dt><dd>Each House or Senate bill counts once. Companion charts group related versions, while each version keeps its own status, sponsor information, and engagement record. Passage of one version does not mean its companion passed.</dd></div><div><dt>Trends</dt><dd>Charts use the published dataset or the selected chamber. The focus-area chart counts primary labels only; Tracker focus-area filters can match either label. A primary–secondary pair counts once per bill. Chart sharing and exports use the same underlying counts.</dd></div><div><dt>Updates and coverage</dt><dd>Official facts are scheduled to refresh daily, and bill details show when they were checked. Candidate discovery searches titles, available CRS summaries, and related-bill links, rather than every bill’s full text. The candidate pool is a review queue, not a definitive count of all AI legislation.</dd></div></dl><p class="methodology-sources">Sources: <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer">Congress.gov</a>, <a href="https://www.govinfo.gov/" target="_blank" rel="noopener noreferrer">GovInfo bill text</a>, and <a href="https://www.siia.net/" target="_blank" rel="noopener noreferrer">SIIA policy materials</a>.</p></section>
  </div></div>`;
}

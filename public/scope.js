import { escapeHtml as esc } from "./format.js";

// Shared by Docs and the standalone candidate-review page.
export const scopeCriteria = [
  {
    title: "Direct AI policy",
    text: "Bills that materially govern, fund, develop, or deploy AI, automated decision systems, or AI-generated content. Examples include model safety, AI adoption, workforce programs, and rights affected by AI.",
  },
  {
    title: "AI-enabling technology and infrastructure",
    text: "Bills with a material connection to AI computing or deployment, including data centers, related energy or water demand, advanced chips, and access to AI computing. The review must explain that connection.",
  },
  {
    title: "Broader policy context",
    text: "Selected privacy, cybersecurity, competition, quantum, intellectual property, and other digital policy bills can provide context when review explains their material relevance to AI policy. Shared terminology alone does not qualify a bill.",
  },
  {
    title: "Outside the scope",
    text: "Incidental mentions, acronym matches, and generic technology or infrastructure bills without a supported AI-policy connection are excluded. Drafts, other Congresses, and non-bill measures are outside this dataset. Unresolved cases stay deferred.",
  },
];

export const candidateReviewSteps = [
  "Confirm the Congress, chamber, bill number, and official title. Check whether that bill is already tracked.",
  "Read the relevant operative provisions and available CRS summary. Identify the scope category and the substantive policy connection.",
  "Record the scope category, an official source, and a short relevance rationale. Broader context needs a specific explanation of why it belongs.",
  "Choose Include, Exclude, or Defer. Before publication, complete the official facts, research summary, focus areas, and a separate SIIA engagement check.",
];

export function scopeMarkup() {
  return `<dl class="scope-rules">${scopeCriteria.map((rule) => `<div><dt>${esc(rule.title)}</dt><dd>${esc(rule.text)}</dd></div>`).join("")}</dl>`;
}

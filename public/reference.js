import { escapeHtml as esc } from "./format.js";

// Shared article structure for documentation and release history.
export function referenceSection({
  id,
  title,
  body,
  attributes = "",
  className = "",
}) {
  return `<section id="${esc(id)}" class="reference-section ${esc(className)}" ${attributes}><h2>${esc(title)}</h2><div class="reference-body">${body}</div></section>`;
}

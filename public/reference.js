import { escapeHtml as esc } from "./format.js";

// One disclosure shell keeps documentation and release history consistent.
export function referencePanel({
  id,
  title,
  body,
  open = false,
  attributes = "",
  className = "",
}) {
  return `<details id="${esc(id)}" class="reference-panel ${esc(className)}" ${attributes}${open ? " open" : ""}><summary class="reference-summary"><h2>${esc(title)}</h2><svg class="reference-chevron" viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg></summary><div class="reference-body">${body}</div></details>`;
}

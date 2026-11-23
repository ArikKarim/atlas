// Public SIIA destinations preserved from the original engagement hyperlinks.
export const engagementMaterials = {
  "H.R.2385": "https://www.siia.net/wp-content/uploads/2026/06/SIIA-Letter-to-House-SST-on-June-25-Markup.pdf",
  "H.R.3447": "https://www.siia.net/the-chip-security-act-is-the-wrong-approach-to-preventing-chip-diversion/",
  "H.R.3562": "https://www.siia.net/policies/siia-commends-senate-passing-the-defiance-act/",
  "H.R.4801": "https://www.siia.net/wp-content/uploads/2025/12/the_siia_federal_ai_legislative_roadmap_final-1.pdf",
  "H.R.633": "https://www.siia.net/siia-supports-passage-of-s-146-the-take-it-down-act/",
  "H.R.5360": "https://www.siia.net/wp-content/uploads/2025/12/SIIA-Letter-Online-Privacy-and-Safety-December-18-2025.pdf",
  "H.R.8413": "https://www.siia.net/siia-backs-the-secure-data-act-as-a-national-framework-for-consumer-privacy-protections/",
  "H.R.5584": "https://www.siia.net/siia-supports-the-lift-ai-act/",
  "H.R.5351": "https://www.siia.net/wp-content/uploads/2026/06/SIIA-Letter-to-House-SST-on-June-25-Markup.pdf",
  "H.R.9334": "https://www.siia.net/wp-content/uploads/2026/06/SIIA-Letter-to-House-SST-on-June-25-Markup.pdf",
  "H.R.6461": "https://www.siia.net/wp-content/uploads/2026/06/SIIA-Letter-to-House-SST-on-June-25-Markup.pdf",
  "H.R.8893": "https://www.siia.net/wp-content/uploads/2026/06/SIIA-Letter-to-House-SST-on-June-25-Markup.pdf",
  "H.R.9372": "https://www.siia.net/wp-content/uploads/2026/06/SIIA-Letter-to-House-SST-on-June-25-Markup.pdf",
  "H.R.9341": "https://www.siia.net/wp-content/uploads/2026/06/SIIA-Letter-to-House-SST-on-June-25-Markup.pdf",
  "H.R.9333": "https://www.siia.net/wp-content/uploads/2026/06/SIIA-Letter-to-House-SST-on-June-25-Markup.pdf",
  "H.R.6633": "https://www.siia.net/siia-endorses-high-capacity-grid-act/",
  "H.R.7757": "https://www.siia.net/siia-statement-on-passage-of-kids-internet-and-digital-safety-kids-act/",
  "S.1837": "https://www.siia.net/policies/siia-commends-senate-passing-the-defiance-act/",
  "S.4596": "https://www.siia.net/policies/siia-supports-the-artificial-intelligence-public-awareness-and-education-campaign-act/",
  "S.1705": "https://www.siia.net/the-chip-security-act-is-the-wrong-approach-to-preventing-chip-diversion/",
  "S.1367": "https://www.siia.net/policies/siia-statement-on-no-fakes/",
  "S.1337": "https://www.siia.net/wp-content/uploads/2025/05/SIIA-Letter-to-House-Cyber-Subcom-051525.pdf",
  "S.2528": "https://www.siia.net/wp-content/uploads/2025/12/the_siia_federal_ai_legislative_roadmap_final-1.pdf",
  "S.2615": "https://www.siia.net/wp-content/uploads/2025/12/the_siia_federal_ai_legislative_roadmap_final-1.pdf",
  "S.2750": "https://www.siia.net/wp-content/uploads/2025/12/the_siia_federal_ai_legislative_roadmap_final-1.pdf",
  "S.4407": "https://www.siia.net/wp-content/uploads/2026/08/SIIA-Letter-to-Senate-Commerce-on-CHATBOT-Act.pdf",
  "S.3062": "https://www.siia.net/wp-content/uploads/2026/04/SIIA-Letter-GUARD-Act.pdf",
  "S.4414": "https://www.siia.net/siia-supports-the-lift-ai-act/",
  "S.1633": "https://www.siia.net/wp-content/uploads/2025/12/the_siia_federal_ai_legislative_roadmap_final-1.pdf",
  "S.3952": "https://www.siia.net/siia-applauds-bipartisan-reintroduction-of-the-future-of-ai-innovation-act/",
  "S.278": "https://www.siia.net/wp-content/uploads/2025/02/SIIA-Letter-to-Senate-Commerce-on-KOSMA.pdf",
  "S.3597": "https://www.siia.net/policies/siia-commends-the-reintroduction-of-the-national-quantum-initiative-reauthorization-act/"
};
export function engagementUrl(bill){const url=engagementMaterials[bill.id.trim()];if(!bill.engagement||!url)return null;try{const parsed=new URL(url);return parsed.protocol==='https:'&&['www.siia.net','siia.net','lda.gov'].includes(parsed.hostname)?url:null;}catch{return null;}}

// Additional public, bill-specific sources located during the engagement-link review.
engagementMaterials['H.R.2683']='https://lda.gov/filings/public/filing/ac082771-05ae-4460-85b7-e2130233bb8d/print/';
engagementMaterials['H.R.9925']='https://lda.gov/filings/public/filing/ac082771-05ae-4460-85b7-e2130233bb8d/print/';
engagementMaterials['S.3957']='https://www.siia.net/siia-supports-key-ai-innovation-education-and-security-bills-before-house-science-committee-markup/';
const materialNotes={
 'H.R.2683':"SIIA's public Q3 2026 lobbying disclosure names the Remote Access Security Act.",
 'H.R.9925':"SIIA's public Q3 2026 lobbying disclosure names the FRONTIER Act.",
 'S.3957':"This SIIA statement supports the NSF AI Education legislation in the House committee package, including the House companion H.R.5351."
};
export function engagementDescription(bill){return materialNotes[bill.id.trim()]||'Read the public SIIA material';}
export function engagementContext(bill){return materialNotes[bill.id.trim()]||'';}

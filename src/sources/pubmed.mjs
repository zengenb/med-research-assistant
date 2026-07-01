import { requestJson } from "../lib/http.mjs";
import { cleanText, normalizeDoi, publicationYear } from "../lib/utils.mjs";

const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

function withNcbiIdentity(params) {
  const email = process.env.MED_RESEARCH_EMAIL;
  const apiKey = process.env.NCBI_API_KEY;
  params.set("tool", "med_research_assistant");
  if (email) params.set("email", email);
  if (apiKey) params.set("api_key", apiKey);
  return params;
}

export function buildPubmedQuery(query, { yearFrom, yearTo, studyTypes = [] } = {}) {
  const clauses = [`(${query})`];
  if (yearFrom || yearTo) clauses.push(`(${yearFrom || 1800}:${yearTo || 3000}[pdat])`);
  if (studyTypes.length) {
    const types = studyTypes.map((type) => `"${type}"[pt]`).join(" OR ");
    clauses.push(`(${types})`);
  }
  return clauses.join(" AND ");
}

export function mapPubmedSummary(summary) {
  const articleIds = summary.articleids || [];
  const doi = normalizeDoi(articleIds.find((item) => item.idtype === "doi")?.value);
  const pmid = String(summary.uid || articleIds.find((item) => item.idtype === "pubmed")?.value || "") || null;
  return {
    id: pmid ? `PMID:${pmid}` : doi ? `DOI:${doi}` : cleanText(summary.title),
    title: cleanText(summary.title),
    authors: (summary.authors || []).map((author) => cleanText(author.name)).filter(Boolean),
    year: publicationYear(summary.pubdate || summary.epubdate || summary.sortpubdate),
    published: cleanText(summary.pubdate || summary.epubdate),
    journal: cleanText(summary.fulljournalname || summary.source),
    doi,
    pmid,
    url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : doi ? `https://doi.org/${doi}` : null,
    publication_types: (summary.pubtype || []).map(cleanText).filter(Boolean),
  };
}

export async function searchPubmed(query, options = {}) {
  const limit = Math.min(Math.max(Number(options.limit || 10), 1), 50);
  const searchParams = withNcbiIdentity(new URLSearchParams({
    db: "pubmed",
    retmode: "json",
    retmax: String(limit),
    sort: "relevance",
    term: buildPubmedQuery(query, options),
  }));
  const search = await requestJson(`${BASE}/esearch.fcgi?${searchParams}`);
  const ids = search.esearchresult?.idlist || [];
  if (!ids.length) return [];

  const summaryParams = withNcbiIdentity(new URLSearchParams({
    db: "pubmed",
    retmode: "json",
    id: ids.join(","),
  }));
  const data = await requestJson(`${BASE}/esummary.fcgi?${summaryParams}`);
  return ids
    .map((id) => data.result?.[id])
    .filter(Boolean)
    .map(mapPubmedSummary);
}

import { requestJson } from "../lib/http.mjs";
import { cleanText, normalizeDoi, publicationYear } from "../lib/utils.mjs";

function crossrefDate(item) {
  const parts = item.published?.["date-parts"]?.[0]
    || item["published-online"]?.["date-parts"]?.[0]
    || item["published-print"]?.["date-parts"]?.[0];
  return parts ? parts.filter(Boolean).join("-") : null;
}

export function mapCrossref(item) {
  const doi = normalizeDoi(item.DOI);
  return {
    id: doi ? `DOI:${doi}` : cleanText(item.title?.[0]),
    title: cleanText(item.title?.[0]),
    authors: (item.author || []).map((author) => cleanText(`${author.given || ""} ${author.family || ""}`)).filter(Boolean),
    year: publicationYear(crossrefDate(item)),
    published: crossrefDate(item),
    journal: cleanText(item["container-title"]?.[0]),
    doi,
    abstract: cleanText(item.abstract),
    url: doi ? `https://doi.org/${doi}` : item.URL || null,
    candidate_full_text_urls: (item.link || []).map((link) => link.URL).filter(Boolean),
    publication_types: item.type ? [item.type] : [],
    cited_by_count: Number(item["is-referenced-by-count"] || 0),
    is_retracted: item.subtype === "retraction" || item.type === "retraction",
  };
}

export async function searchCrossref(query, options = {}) {
  const limit = Math.min(Math.max(Number(options.limit || 10), 1), 50);
  const params = new URLSearchParams({
    "query.bibliographic": query,
    rows: String(limit),
    sort: "relevance",
    order: "desc",
  });
  const filters = [];
  if (options.yearFrom) filters.push(`from-pub-date:${options.yearFrom}-01-01`);
  if (options.yearTo) filters.push(`until-pub-date:${options.yearTo}-12-31`);
  if (filters.length) params.set("filter", filters.join(","));
  if (process.env.MED_RESEARCH_EMAIL) params.set("mailto", process.env.MED_RESEARCH_EMAIL);
  const data = await requestJson(`https://api.crossref.org/works?${params}`);
  return (data.message?.items || []).map(mapCrossref);
}

export async function getCrossrefWork(doi) {
  const normalized = normalizeDoi(doi);
  const data = await requestJson(`https://api.crossref.org/works/${encodeURIComponent(normalized)}`);
  return data.message ? mapCrossref(data.message) : null;
}

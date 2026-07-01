import { requestJson } from "../lib/http.mjs";
import { cleanText, normalizeDoi } from "../lib/utils.mjs";

export function mapSemanticScholar(item) {
  const doi = normalizeDoi(item.externalIds?.DOI);
  const pmid = item.externalIds?.PubMed ? String(item.externalIds.PubMed) : null;
  return {
    id: pmid ? `PMID:${pmid}` : doi ? `DOI:${doi}` : item.paperId,
    title: cleanText(item.title),
    authors: (item.authors || []).map((author) => cleanText(author.name)).filter(Boolean),
    year: item.year || null,
    published: item.publicationDate || null,
    journal: cleanText(item.venue),
    doi,
    pmid,
    abstract: cleanText(item.abstract),
    url: item.url || (doi ? `https://doi.org/${doi}` : null),
    full_text_urls: item.openAccessPdf?.url ? [item.openAccessPdf.url] : [],
    is_open_access: Boolean(item.openAccessPdf?.url),
    publication_types: item.publicationTypes || [],
    cited_by_count: Number(item.citationCount || 0),
  };
}

export async function searchSemanticScholar(query, options = {}) {
  const limit = Math.min(Math.max(Number(options.limit || 10), 1), 50);
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    fields: "title,authors,year,venue,externalIds,url,abstract,openAccessPdf,citationCount,publicationTypes,publicationDate",
  });
  const headers = process.env.SEMANTIC_SCHOLAR_API_KEY
    ? { "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY }
    : {};
  const data = await requestJson(`https://api.semanticscholar.org/graph/v1/paper/search?${params}`, { headers });
  return (data.data || []).map(mapSemanticScholar);
}

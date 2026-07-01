import { requestJson } from "../lib/http.mjs";
import { cleanText, normalizeDoi } from "../lib/utils.mjs";

export function mapOpenAlex(item) {
  const doi = normalizeDoi(item.doi || item.ids?.doi);
  const oaUrl = item.best_oa_location?.pdf_url || item.best_oa_location?.landing_page_url;
  return {
    id: item.id || (doi ? `DOI:${doi}` : cleanText(item.display_name)),
    title: cleanText(item.display_name || item.title),
    authors: (item.authorships || []).map((entry) => cleanText(entry.author?.display_name)).filter(Boolean),
    year: item.publication_year || null,
    published: item.publication_date || null,
    journal: cleanText(item.primary_location?.source?.display_name),
    doi,
    url: item.primary_location?.landing_page_url || (doi ? `https://doi.org/${doi}` : item.id),
    full_text_urls: oaUrl ? [oaUrl] : [],
    is_open_access: item.open_access?.is_oa || false,
    publication_types: item.type ? [item.type] : [],
    cited_by_count: Number(item.cited_by_count || 0),
    is_retracted: Boolean(item.is_retracted),
  };
}

export async function searchOpenAlex(query, options = {}) {
  const apiKey = process.env.OPENALEX_API_KEY;
  if (!apiKey) throw new Error("OPENALEX_API_KEY is not configured (free key supported)");
  const limit = Math.min(Math.max(Number(options.limit || 10), 1), 50);
  const params = new URLSearchParams({
    search: query,
    "per-page": String(limit),
    api_key: apiKey,
  });
  const filters = [];
  if (options.yearFrom) filters.push(`from_publication_date:${options.yearFrom}-01-01`);
  if (options.yearTo) filters.push(`to_publication_date:${options.yearTo}-12-31`);
  if (filters.length) params.set("filter", filters.join(","));
  const data = await requestJson(`https://api.openalex.org/works?${params}`);
  return (data.results || []).map(mapOpenAlex);
}

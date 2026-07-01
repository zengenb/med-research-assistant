import { requestJson, requestText } from "../lib/http.mjs";
import { cleanText, normalizeDoi, publicationYear } from "../lib/utils.mjs";

const BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest";

export function buildEuropePmcQuery(query, { yearFrom, yearTo } = {}) {
  const clauses = [`(${query})`];
  if (yearFrom || yearTo) {
    clauses.push(`FIRST_PDATE:[${yearFrom || 1800}-01-01 TO ${yearTo || 3000}-12-31]`);
  }
  return clauses.join(" AND ");
}

function fullTextUrls(item) {
  const urls = (item.fullTextUrlList?.fullTextUrl || []).map((entry) => entry.url).filter(Boolean);
  if (item.pmcid) urls.push(`https://europepmc.org/articles/${item.pmcid}`);
  return [...new Set(urls)];
}

export function mapEuropePmc(item) {
  const pmid = item.pmid || (item.source === "MED" ? item.id : null);
  const doi = normalizeDoi(item.doi);
  return {
    id: pmid ? `PMID:${pmid}` : doi ? `DOI:${doi}` : item.id,
    title: cleanText(item.title),
    authors: (item.authorList?.author || []).map((author) => cleanText(author.fullName || `${author.firstName || ""} ${author.lastName || ""}`)).filter(Boolean),
    year: publicationYear(item.pubYear || item.firstPublicationDate),
    published: cleanText(item.firstPublicationDate || item.journalInfo?.printPublicationDate),
    journal: cleanText(item.journalTitle || item.journalInfo?.journal?.title),
    doi,
    pmid: pmid ? String(pmid) : null,
    pmcid: item.pmcid || null,
    abstract: cleanText(item.abstractText),
    url: pmid ? `https://europepmc.org/article/MED/${pmid}` : item.pmcid ? `https://europepmc.org/articles/${item.pmcid}` : doi ? `https://doi.org/${doi}` : null,
    full_text_urls: fullTextUrls(item),
    is_open_access: item.isOpenAccess === "Y" || item.openAccess === true,
    publication_types: (item.pubTypeList?.pubType || []).map(cleanText).filter(Boolean),
    cited_by_count: Number(item.citedByCount || 0),
  };
}

export async function searchEuropePmc(query, options = {}) {
  const limit = Math.min(Math.max(Number(options.limit || 10), 1), 50);
  const params = new URLSearchParams({
    query: buildEuropePmcQuery(query, options),
    format: "json",
    pageSize: String(limit),
    resultType: "core",
  });
  const data = await requestJson(`${BASE}/search?${params}`);
  return (data.resultList?.result || []).map(mapEuropePmc);
}

export async function getEuropePmcArticle(identifier) {
  const isDoi = String(identifier).includes("/");
  const query = isDoi ? `DOI:"${normalizeDoi(identifier)}"` : `EXT_ID:"${String(identifier).replace(/^PMID:/i, "")}"`;
  const results = await searchEuropePmc(query, { limit: 5 });
  return results[0] || null;
}

export async function getEuropePmcFullText(pmcid) {
  const id = String(pmcid || "").trim().toUpperCase();
  if (!/^PMC\d+$/.test(id)) return null;
  const xml = await requestText(`${BASE}/${encodeURIComponent(id)}/fullTextXML`);
  const body = xml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || xml;
  return cleanText(body)?.slice(0, 120_000) || null;
}

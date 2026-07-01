import { searchLiterature } from "./federated.mjs";
import { getEuropePmcArticle, getEuropePmcFullText } from "./sources/europepmc.mjs";
import { getCrossrefWork } from "./sources/crossref.mjs";
import { normalizeDoi } from "./lib/utils.mjs";

function canonicalId(item) {
  if (item.pmid) return `PMID:${item.pmid}`;
  if (item.doi) return `DOI:${normalizeDoi(item.doi)}`;
  return String(item.id || item.url || item.title);
}

export function toChatGptSearchResult(item) {
  const url = item.url || (item.doi ? `https://doi.org/${normalizeDoi(item.doi)}` : null);
  if (!url) return null;
  return { id: canonicalId(item), title: item.title || canonicalId(item), url };
}

export async function chatGptSearch(query, { limit = 10 } = {}) {
  const discovery = await searchLiterature(query, { limit });
  return {
    results: discovery.results.map(toChatGptSearchResult).filter(Boolean),
  };
}

function articleText(article, fullText) {
  if (fullText) return fullText;
  const lines = [
    article?.title,
    article?.abstract,
    article?.authors?.length ? `Authors: ${article.authors.join(", ")}` : null,
    article?.journal ? `Journal: ${article.journal}` : null,
    article?.published || article?.year ? `Published: ${article.published || article.year}` : null,
    article?.doi ? `DOI: ${article.doi}` : null,
    article?.pmid ? `PMID: ${article.pmid}` : null,
  ];
  return lines.filter(Boolean).join("\n\n") || "Metadata was not available for this identifier.";
}

export async function chatGptFetch(id) {
  const raw = String(id || "").trim();
  if (!raw) throw new Error("id must not be empty");
  const explicitDoi = raw.replace(/^DOI:/i, "");
  const doi = normalizeDoi(explicitDoi);
  const isDoi = /^DOI:/i.test(raw) || Boolean(doi?.includes("/"));
  const identifier = isDoi ? doi : raw.replace(/^PMID:/i, "");
  const [europepmc, crossref] = await Promise.all([
    getEuropePmcArticle(identifier).catch(() => null),
    isDoi ? getCrossrefWork(doi).catch(() => null) : Promise.resolve(null),
  ]);
  const article = europepmc || crossref;
  if (!article) throw new Error(`No article found for ${raw}`);

  let fullText = null;
  if (europepmc?.pmcid && europepmc.is_open_access) {
    fullText = await getEuropePmcFullText(europepmc.pmcid).catch(() => null);
  }
  const canonicalUrl = article.url || (article.doi ? `https://doi.org/${normalizeDoi(article.doi)}` : "");
  return {
    id: canonicalId(article),
    title: article.title || raw,
    text: articleText(article, fullText),
    url: canonicalUrl,
    metadata: {
      content_level: fullText ? "open_full_text" : article.abstract ? "abstract" : "metadata_only",
      doi: article.doi || null,
      pmid: article.pmid || null,
      pmcid: article.pmcid || null,
      journal: article.journal || null,
      year: article.year || null,
      sources: article.sources || (europepmc ? ["europepmc"] : ["crossref"]),
    },
  };
}

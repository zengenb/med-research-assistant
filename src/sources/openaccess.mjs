import { requestJson } from "../lib/http.mjs";
import { compactObject, normalizeDoi } from "../lib/utils.mjs";
import { getEuropePmcArticle } from "./europepmc.mjs";

function locationFromUnpaywall(location) {
  if (!location?.url) return null;
  return compactObject({
    source: "unpaywall",
    url: location.url_for_pdf || location.url_for_landing_page || location.url,
    landing_page: location.url_for_landing_page,
    host_type: location.host_type,
    version: location.version,
    license: location.license,
  });
}

export async function resolveOpenFullText({ doi, pmid }) {
  const normalizedDoi = normalizeDoi(doi);
  const identifier = pmid || normalizedDoi;
  if (!identifier) throw new Error("A DOI or PMID is required");
  const locations = [];
  const warnings = [];

  try {
    const article = await getEuropePmcArticle(identifier);
    for (const url of article?.full_text_urls || []) {
      locations.push({ source: "europepmc", url, pmcid: article.pmcid || null });
    }
  } catch (error) {
    warnings.push(`Europe PMC lookup failed: ${error.message}`);
  }

  const email = process.env.MED_RESEARCH_EMAIL;
  if (normalizedDoi && email) {
    try {
      const data = await requestJson(`https://api.unpaywall.org/v2/${encodeURIComponent(normalizedDoi)}?email=${encodeURIComponent(email)}`);
      const candidates = [data.best_oa_location, ...(data.oa_locations || [])]
        .map(locationFromUnpaywall)
        .filter(Boolean);
      locations.push(...candidates);
    } catch (error) {
      if (error.status !== 404) warnings.push(`Unpaywall lookup failed: ${error.message}`);
    }
  } else if (normalizedDoi && !email) {
    warnings.push("Set MED_RESEARCH_EMAIL to enable the free Unpaywall API.");
  }

  const uniqueLocations = [...new Map(locations.map((item) => [item.url, item])).values()];
  return {
    doi: normalizedDoi,
    pmid: pmid ? String(pmid) : null,
    is_open_access: uniqueLocations.length > 0,
    locations: uniqueLocations,
    warnings,
    checked_at: new Date().toISOString(),
  };
}

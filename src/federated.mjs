import { dedupeAndRank } from "./lib/utils.mjs";
import { searchPubmed } from "./sources/pubmed.mjs";
import { searchEuropePmc } from "./sources/europepmc.mjs";
import { searchCrossref } from "./sources/crossref.mjs";
import { searchClinicalTrials } from "./sources/clinicaltrials.mjs";
import { searchOpenAlex } from "./sources/openalex.mjs";
import { searchSemanticScholar } from "./sources/semanticscholar.mjs";

const SEARCHERS = {
  pubmed: searchPubmed,
  europepmc: searchEuropePmc,
  crossref: searchCrossref,
  openalex: searchOpenAlex,
  semanticscholar: searchSemanticScholar,
};

const DEFAULT_SOURCES = ["pubmed", "europepmc", "crossref"];

export async function searchLiterature(query, options = {}) {
  if (!String(query || "").trim()) throw new Error("query must not be empty");
  const limit = Math.min(Math.max(Number(options.limit || 10), 1), 50);
  const requested = options.sources?.length ? options.sources : DEFAULT_SOURCES;
  const perSourceLimit = Math.min(limit * 3, 50);
  const startedAt = new Date().toISOString();
  const tasks = requested.map(async (source) => {
    const searcher = SEARCHERS[source];
    if (!searcher) return { source, ok: false, error: "Unsupported source" };
    try {
      const results = await searcher(query, { ...options, limit: perSourceLimit });
      return { source, ok: true, results };
    } catch (error) {
      return { source, ok: false, error: error.message };
    }
  });
  const settled = await Promise.all(tasks);
  const successful = settled.filter((item) => item.ok);
  const results = dedupeAndRank(successful, limit, query);

  let trials;
  if (options.includeTrials) {
    try {
      trials = await searchClinicalTrials(query, { limit: Math.min(limit, 20) });
    } catch (error) {
      trials = { total_count: null, studies: [], error: error.message };
    }
  }

  return {
    query,
    filters: {
      year_from: options.yearFrom || null,
      year_to: options.yearTo || null,
      study_types: options.studyTypes || [],
    },
    audit: {
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      sources_requested: requested,
      sources_succeeded: successful.map((item) => item.source),
      sources_failed: settled.filter((item) => !item.ok).map(({ source, error }) => ({ source, error })),
      raw_result_counts: Object.fromEntries(successful.map((item) => [item.source, item.results.length])),
      deduplicated_result_count: results.length,
    },
    results,
    clinical_trials: trials,
    warnings: [
      "Search results are discovery evidence, not clinical recommendations.",
      "Crossref full-text links are candidates; use resolve_open_fulltext before treating them as open access.",
      "Verify retraction status, study design, full text, and applicability before synthesis.",
    ],
  };
}

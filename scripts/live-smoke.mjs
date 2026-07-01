import { searchLiterature } from "../src/federated.mjs";

const result = await searchLiterature("physical restraint intensive care", { limit: 5 });
if (!result.results.length) throw new Error("Live search returned no results");
if (!result.audit.sources_succeeded.length) throw new Error("No source succeeded");
console.log(JSON.stringify({
  query: result.query,
  sources_succeeded: result.audit.sources_succeeded,
  sources_failed: result.audit.sources_failed,
  results: result.results.map(({ rank, title, doi, pmid, sources }) => ({ rank, title, doi, pmid, sources })),
}, null, 2));

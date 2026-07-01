import test from "node:test";
import assert from "node:assert/strict";
import { cleanText, dedupeAndRank, normalizeDoi, normalizeTitle, publicationYear } from "../src/lib/utils.mjs";
import { buildPubmedQuery, mapPubmedSummary } from "../src/sources/pubmed.mjs";
import { mapEuropePmc } from "../src/sources/europepmc.mjs";
import { mapCrossref } from "../src/sources/crossref.mjs";
import { mapClinicalTrial } from "../src/sources/clinicaltrials.mjs";
import { mapOpenAlex } from "../src/sources/openalex.mjs";
import { mapSemanticScholar } from "../src/sources/semanticscholar.mjs";
import { toChatGptSearchResult } from "../src/chatgpt.mjs";

test("normalizes DOI and title identifiers", () => {
  assert.equal(normalizeDoi("https://doi.org/10.1000/ABC.1."), "10.1000/abc.1");
  assert.equal(normalizeTitle("  Physical—Restraint: Study "), "physical restraint study");
});

test("cleans markup and extracts publication years", () => {
  assert.equal(cleanText("<b>A &amp; B</b>"), "A & B");
  assert.equal(publicationYear("2024 Jan-Feb"), 2024);
});

test("builds bounded PubMed queries", () => {
  const query = buildPubmedQuery("restraint", { yearFrom: 2020, yearTo: 2025, studyTypes: ["Randomized Controlled Trial"] });
  assert.match(query, /2020:2025\[pdat\]/);
  assert.match(query, /Randomized Controlled Trial/);
});

test("maps PubMed summaries", () => {
  const item = mapPubmedSummary({ uid: "123", title: "Test.", pubdate: "2025", fulljournalname: "Journal", authors: [{ name: "A Author" }], articleids: [{ idtype: "doi", value: "10.1/X" }], pubtype: ["Review"] });
  assert.equal(item.pmid, "123");
  assert.equal(item.doi, "10.1/x");
  assert.deepEqual(item.publication_types, ["Review"]);
});

test("maps Europe PMC core records", () => {
  const item = mapEuropePmc({ id: "42", source: "MED", pmid: "42", title: "Evidence", pubYear: "2024", abstractText: "Abstract", isOpenAccess: "Y", pmcid: "PMC42" });
  assert.equal(item.is_open_access, true);
  assert.ok(item.full_text_urls.some((url) => url.includes("PMC42")));
});

test("maps Crossref records", () => {
  const item = mapCrossref({ DOI: "10.2/ABC", title: ["A title"], author: [{ given: "Ada", family: "Lovelace" }], published: { "date-parts": [[2023, 2, 1]] }, "container-title": ["J"] });
  assert.equal(item.doi, "10.2/abc");
  assert.equal(item.year, 2023);
});

test("maps ClinicalTrials.gov studies", () => {
  const item = mapClinicalTrial({ protocolSection: { identificationModule: { nctId: "NCT00000001", briefTitle: "Trial" }, statusModule: { overallStatus: "COMPLETED" } } });
  assert.equal(item.nct_id, "NCT00000001");
  assert.equal(item.status, "COMPLETED");
});

test("deduplicates records by DOI and merges provenance", () => {
  const results = dedupeAndRank([
    { source: "pubmed", results: [{ title: "Same", doi: "10.1/a", pmid: "1" }] },
    { source: "crossref", results: [{ title: "Same title expanded", doi: "https://doi.org/10.1/A", abstract: "Longer abstract" }] },
  ], 10);
  assert.equal(results.length, 1);
  assert.deepEqual(results[0].sources.sort(), ["crossref", "pubmed"]);
  assert.equal(results[0].abstract, "Longer abstract");
});

test("lexical coverage improves ranking across source lists", () => {
  const results = dedupeAndRank([
    { source: "one", results: [{ title: "Physical restraint in behavioral care", doi: "10.1/less" }] },
    { source: "two", results: [{ title: "Physical restraint in intensive care units", doi: "10.1/more" }] },
  ], 2, "physical restraint intensive care");
  assert.equal(results[0].doi, "10.1/more");
});

test("maps optional OpenAlex and Semantic Scholar records", () => {
  const openAlex = mapOpenAlex({ id: "W1", display_name: "Study", publication_year: 2025, doi: "https://doi.org/10.1/OA", authorships: [{ author: { display_name: "A" } }], open_access: { is_oa: true } });
  const semantic = mapSemanticScholar({ paperId: "S1", title: "Study", year: 2025, externalIds: { DOI: "10.1/S2", PubMed: "7" }, authors: [{ name: "B" }] });
  assert.equal(openAlex.doi, "10.1/oa");
  assert.equal(semantic.pmid, "7");
});

test("maps literature records to ChatGPT citation results", () => {
  assert.deepEqual(toChatGptSearchResult({
    title: "Evidence review",
    pmid: "123",
    doi: "10.1/example",
    url: "https://europepmc.org/article/MED/123",
  }), {
    id: "PMID:123",
    title: "Evidence review",
    url: "https://europepmc.org/article/MED/123",
  });
  assert.equal(toChatGptSearchResult({ title: "No URL" }), null);
});

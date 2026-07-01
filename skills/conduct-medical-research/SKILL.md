---
name: conduct-medical-research
description: Search, verify, and synthesize medical literature with auditable provenance. Use for clinical or biomedical literature reviews, PICO/MeSH search planning, systematic-review discovery, citation verification, open-full-text lookup, clinical-trial retrieval, Chinese/English cross-database searching, and evidence tables. Do not use as a substitute for clinical judgment or patient-specific medical advice.
---

# Conduct Medical Research

Use the bundled `med-research` MCP tools for structured discovery. Use authorized browser access only for sources that lack a stable API.

## Workflow

1. Restate the research question and identify population, exposure/intervention, comparator, outcomes, timeframe, setting, and eligible study designs.
2. Build separate concept blocks. Add controlled vocabulary, spelling variants, abbreviations, drug generic/brand names, and Chinese/English equivalents. Do not silently add outcome terms when doing so would reduce recall.
3. Call `search_literature` with the broadest defensible query. Record its audit block. Narrow by date or publication type only when the protocol requires it.
4. Inspect duplicates, source coverage, missing abstracts, retraction signals, and source failures. Use `get_article` for exact PMID/DOI verification and `search_clinical_trials` when registered or unpublished evidence matters.
5. Call `resolve_open_fulltext` before claiming that full text is freely available. Treat Crossref publisher links as candidates, not open-access proof.
6. For Chinese evidence, call `chinese_search_portals`. Prefer PubScholar and NSTL, then use SinoMed, Wanfang, CNKI, or a user-authorized gateway in a signed-in browser. Never store passwords, cookies, or CAPTCHA answers. Never automate bulk downloads or bypass access controls.
7. Import RIS/BibTeX/EndNote records and lawful PDFs into Zotero or a local evidence folder. Extract claims only from text actually available.
8. Produce an evidence table with identifiers, design, sample, setting, intervention/exposure, comparator, outcomes, effect estimates, uncertainty, limitations, and source location.
9. Separate evidence from inference. Cite every material factual claim with DOI, PMID, PMCID, NCT ID, or a stable source URL. For local full text, add page/table/figure locations.
10. State coverage gaps, failed sources, access limitations, date searched, and reasons for exclusions.

## Guardrails

- Do not invent citations, abstracts, effect estimates, page numbers, or eligibility decisions.
- Do not infer study quality from journal reputation or citation count.
- Do not combine preprints with peer-reviewed evidence without labeling them.
- Check corrections, expressions of concern, and retractions before relying on pivotal studies.
- Keep patient identifiers and unpublished clinical data out of external search queries.
- Require clinician or domain-expert review before using the synthesis for care decisions.

Read [references/evidence-workflow.md](references/evidence-workflow.md) when preparing a systematic review, evidence table, or risk-of-bias assessment.

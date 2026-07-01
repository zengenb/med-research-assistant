# Medical Research Assistant

Medical Research Assistant is a local MCP server and Codex plugin for reproducible medical-literature discovery. It searches several free scholarly services in parallel, merges duplicate records, records source failures, resolves legal open-access copies, and hands closed Chinese databases to an authorized browser workflow instead of storing credentials or bypassing access controls.

## What works without paid API keys

- PubMed metadata through NCBI E-utilities
- Europe PMC metadata, abstracts, and open-access links
- Crossref DOI and publication metadata
- ClinicalTrials.gov study records
- Chinese portal handoff for PubScholar, NSTL, SinoMed, Wanfang, CNKI, and an optional user-authorized gateway

Optional free configuration enables Unpaywall (`MED_RESEARCH_EMAIL`), higher NCBI limits (`NCBI_API_KEY`), OpenAlex (`OPENALEX_API_KEY`), and higher Semantic Scholar limits (`SEMANTIC_SCHOLAR_API_KEY`). Add `openalex` or `semanticscholar` to the `sources` argument when you want those optional indexes.

## MCP tools

- `search_literature`: federated, deduplicated literature search with a query audit
- `get_article`: retrieve one article by PMID or DOI
- `resolve_open_fulltext`: locate legal open-access copies
- `search_clinical_trials`: search ClinicalTrials.gov
- `chinese_search_portals`: prepare a safe handoff to Chinese discovery portals
- `med_research_status`: report enabled sources and optional configuration

## Local development

```powershell
npm install
npm test
npm run check
npm run smoke
npm run smoke:mcp
```

Run a direct search:

```powershell
node src/cli.mjs search "physical restraint intensive care" --limit 5
```

Run the MCP server:

```powershell
node src/server.mjs
```

Register it with Codex from an absolute checkout path:

```powershell
codex mcp add med-research -- node C:\absolute\path\to\med-research-assistant\src\server.mjs
```

The repository is also a Codex plugin. Its bundled `conduct-medical-research` skill enforces query planning, provenance, citation verification, and cautious use of authorized browser sessions.

## Retrieval policy

This project never embeds database usernames, passwords, cookies, or CAPTCHA solutions. It does not bypass paywalls. Links returned by Crossref are candidates, not proof of open access; `resolve_open_fulltext` uses Europe PMC and, when configured, Unpaywall to identify legal copies. Browser-only portals remain user-authorized, rate-limited fallbacks.

Do not use generated synthesis as clinical advice. Verify decisions against primary literature, current guidelines, local policy, and qualified clinical judgment.

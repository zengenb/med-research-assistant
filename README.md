# Medical Literature Research for ChatGPT

A read-only ChatGPT data app for reproducible medical-literature discovery. It searches free scholarly services in parallel, deduplicates records, preserves source provenance, returns citable URLs, and retrieves legal Europe PMC open full text when available.

No paid literature API is required for the default sources:

- PubMed / NCBI E-utilities
- Europe PMC abstracts and open full text
- Crossref DOI metadata
- ClinicalTrials.gov
- optional OpenAlex and Semantic Scholar coverage
- safe browser handoff links for PubScholar, NSTL, SinoMed, Wanfang, and CNKI

The project never stores literature-database usernames, passwords, cookies, or CAPTCHA answers and does not bypass paywalls.

## ChatGPT-compatible tools

- `search`: ChatGPT chat, deep research, and company-knowledge discovery schema
- `fetch`: citable abstract, metadata, or legal Europe PMC open full text
- `search_literature`: advanced multi-source search and source audit
- `get_article`: retrieve a record by PMID or DOI
- `resolve_open_fulltext`: resolve legal open-access copies
- `search_clinical_trials`: search ClinicalTrials.gov
- `chinese_search_portals`: generate authorized Chinese-database search handoffs
- `med_research_status`: report sources and optional configuration

Every tool is declared read-only. `search` and `fetch` include explicit output schemas and canonical URLs so ChatGPT can create citations.

## Local validation

```powershell
npm ci
npm test
npm run check
npm run smoke:mcp
npm run smoke:chatgpt
```

## Connect to ChatGPT without making the server public

ChatGPT cannot connect directly to a local stdio MCP server. Use OpenAI Secure MCP Tunnel:

1. In ChatGPT, open **Settings → Apps → Advanced settings** and enable **Developer mode**.
2. In OpenAI Platform tunnel settings, create a tunnel associated with the same ChatGPT workspace and obtain its `tunnel_id` and runtime API key.
3. Download the official `openai/tunnel-client` release. Initialize a local stdio profile:

```powershell
$env:CONTROL_PLANE_API_KEY="your-runtime-key"
tunnel-client init --sample sample_mcp_stdio_local --profile med-research --tunnel-id tunnel_xxx --mcp-command "node C:\absolute\path\med-research-assistant\src\server.mjs"
tunnel-client doctor --profile med-research --explain
tunnel-client run --profile med-research
```

4. Keep `tunnel-client run` active. In ChatGPT **Settings → Apps**, create an app named **Medical Literature Research**, choose **Tunnel** as the connection, and select that tunnel.
5. Start a new chat, enable the app from the tools menu, and ask ChatGPT to use it.

Optional free configuration is documented in `.env.example`. It can enable Unpaywall, a higher NCBI rate limit, and additional indexes, but the default federated search works without those keys.

## Research cautions

Discovery results are not clinical recommendations. Verify study design, retraction status, full text, guidelines, applicability, and local policy before clinical or research use.

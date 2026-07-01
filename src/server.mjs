import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchLiterature } from "./federated.mjs";
import { getEuropePmcArticle } from "./sources/europepmc.mjs";
import { getCrossrefWork } from "./sources/crossref.mjs";
import { searchClinicalTrials } from "./sources/clinicaltrials.mjs";
import { resolveOpenFullText } from "./sources/openaccess.mjs";
import { chineseSearchPortals } from "./sources/chinese.mjs";
import { normalizeDoi } from "./lib/utils.mjs";
import { chatGptFetch, chatGptSearch } from "./chatgpt.mjs";

const server = new McpServer({
  name: "Medical Literature Research",
  version: "0.2.0",
});

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

function response(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

server.registerTool("search", {
  title: "Search medical literature for ChatGPT",
  description: "Use this to search medical literature for ChatGPT chat, deep research, and company knowledge. Returns stable identifiers and canonical citation URLs.",
  inputSchema: {
    query: z.string().min(1).describe("Natural-language, Boolean, PICO, DOI, or subject query"),
  },
  outputSchema: {
    results: z.array(z.object({
      id: z.string(),
      title: z.string(),
      url: z.string().url(),
    })),
  },
  annotations: READ_ONLY,
}, async ({ query }) => response(await chatGptSearch(query)));

server.registerTool("fetch", {
  title: "Read a medical literature result",
  description: "Use this after search to retrieve an article abstract, metadata, or legal Europe PMC open full text for evidence analysis and citation.",
  inputSchema: {
    id: z.string().min(1).describe("Identifier returned by search, such as PMID:12345 or DOI:10.x/example"),
  },
  outputSchema: {
    id: z.string(),
    title: z.string(),
    text: z.string(),
    url: z.string(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  },
  annotations: READ_ONLY,
}, async ({ id }) => response(await chatGptFetch(id)));

server.registerTool("search_literature", {
  title: "Search medical literature",
  description: "Search PubMed, Europe PMC, and Crossref in parallel; deduplicate records and return a source audit. No paid API key is required.",
  inputSchema: {
    query: z.string().min(1).describe("Boolean, keyword, or subject query"),
    limit: z.number().int().min(1).max(50).default(10),
    sources: z.array(z.enum(["pubmed", "europepmc", "crossref", "openalex", "semanticscholar"])).optional(),
    year_from: z.number().int().min(1800).max(3000).optional(),
    year_to: z.number().int().min(1800).max(3000).optional(),
    study_types: z.array(z.string()).optional().describe("PubMed publication types, for example Randomized Controlled Trial"),
    include_trials: z.boolean().default(false),
  },
  annotations: READ_ONLY,
}, async (input) => response(await searchLiterature(input.query, {
  limit: input.limit,
  sources: input.sources,
  yearFrom: input.year_from,
  yearTo: input.year_to,
  studyTypes: input.study_types,
  includeTrials: input.include_trials,
})));

server.registerTool("get_article", {
  title: "Get article metadata",
  description: "Retrieve a single article by PMID or DOI, preferring Europe PMC abstracts and merging Crossref DOI metadata when available.",
  inputSchema: {
    identifier: z.string().min(1).describe("PMID, DOI, or DOI URL"),
  },
  annotations: READ_ONLY,
}, async ({ identifier }) => {
  const doi = normalizeDoi(identifier);
  const isDoi = Boolean(doi && doi.includes("/"));
  const [europePmc, crossref] = await Promise.all([
    getEuropePmcArticle(isDoi ? doi : identifier).catch(() => null),
    isDoi ? getCrossrefWork(doi).catch(() => null) : Promise.resolve(null),
  ]);
  return response({ identifier, europepmc: europePmc, crossref, found: Boolean(europePmc || crossref) });
});

server.registerTool("resolve_open_fulltext", {
  title: "Resolve open full text",
  description: "Find legal open-access copies through Europe PMC and optional free Unpaywall access. Does not bypass paywalls.",
  inputSchema: {
    doi: z.string().optional(),
    pmid: z.string().optional(),
  },
  annotations: READ_ONLY,
}, async (input) => response(await resolveOpenFullText(input)));

server.registerTool("search_clinical_trials", {
  title: "Search clinical trials",
  description: "Search the free ClinicalTrials.gov v2 API and return structured study records.",
  inputSchema: {
    query: z.string().min(1),
    limit: z.number().int().min(1).max(100).default(10),
  },
  annotations: READ_ONLY,
}, async ({ query, limit }) => response(await searchClinicalTrials(query, { limit })));

server.registerTool("chinese_search_portals", {
  title: "Prepare Chinese literature search",
  description: "Return Chinese discovery portals and a safe browser handoff. It never stores credentials or automates bulk downloads.",
  inputSchema: {
    query: z.string().min(1),
    include_authorized_gateway: z.boolean().default(false),
  },
  annotations: READ_ONLY,
}, async ({ query, include_authorized_gateway: includeGateway }) => response(chineseSearchPortals({ query, includeGateway })));

server.registerTool("med_research_status", {
  title: "Medical research service status",
  description: "Report default sources, optional enhancements, and privacy behavior.",
  inputSchema: {},
  annotations: READ_ONLY,
}, async () => response({
  service: "med-research",
  version: "0.2.0",
  default_sources: ["pubmed", "europepmc", "crossref", "clinicaltrials.gov"],
  optional_features: {
    unpaywall: Boolean(process.env.MED_RESEARCH_EMAIL),
    ncbi_higher_rate_limit: Boolean(process.env.NCBI_API_KEY),
    openalex_key_present: Boolean(process.env.OPENALEX_API_KEY),
    semantic_scholar_key_present: Boolean(process.env.SEMANTIC_SCHOLAR_API_KEY),
  },
  privacy: "No literature-database credentials, cookies, or patient data are stored.",
}));

const transport = new StdioServerTransport();
await server.connect(transport);

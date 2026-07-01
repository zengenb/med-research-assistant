import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [fileURLToPath(new URL("../src/server.mjs", import.meta.url))],
});
const client = new Client({ name: "med-research-smoke", version: "0.1.0" });
await client.connect(transport);
try {
  const tools = await client.listTools();
  const names = tools.tools.map((tool) => tool.name).sort();
  const required = ["chinese_search_portals", "fetch", "get_article", "med_research_status", "resolve_open_fulltext", "search", "search_clinical_trials", "search_literature"];
  if (JSON.stringify(names) !== JSON.stringify(required.sort())) throw new Error(`Unexpected tools: ${names.join(", ")}`);
  for (const name of ["search", "fetch"]) {
    const tool = tools.tools.find((candidate) => candidate.name === name);
    if (!tool?.annotations?.readOnlyHint) throw new Error(`${name} must be declared read-only`);
    if (!tool?.outputSchema) throw new Error(`${name} must declare an output schema`);
  }
  const status = await client.callTool({ name: "med_research_status", arguments: {} });
  if (status.isError) throw new Error("Status tool returned an error");
  console.log(JSON.stringify({ tools: names, status: "ok" }, null, 2));
} finally {
  await client.close();
}

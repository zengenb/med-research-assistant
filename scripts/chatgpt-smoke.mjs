import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [fileURLToPath(new URL("../src/server.mjs", import.meta.url))],
});
const client = new Client({ name: "chatgpt-compatibility-smoke", version: "0.2.0" });
await client.connect(transport);
try {
  const search = await client.callTool({
    name: "search",
    arguments: { query: "physical restraint intensive care scoping review" },
  });
  if (search.isError || !search.structuredContent?.results?.length) throw new Error("ChatGPT search returned no results");
  const first = search.structuredContent.results[0];
  const fetched = await client.callTool({ name: "fetch", arguments: { id: first.id } });
  if (fetched.isError || !fetched.structuredContent?.text || !fetched.structuredContent?.url) {
    throw new Error("ChatGPT fetch did not return citable article content");
  }
  console.log(JSON.stringify({
    search_result_count: search.structuredContent.results.length,
    fetched: {
      id: fetched.structuredContent.id,
      title: fetched.structuredContent.title,
      content_level: fetched.structuredContent.metadata?.content_level,
      url: fetched.structuredContent.url,
    },
  }, null, 2));
} finally {
  await client.close();
}

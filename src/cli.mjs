import { searchLiterature } from "./federated.mjs";
import { searchClinicalTrials } from "./sources/clinicaltrials.mjs";
import { resolveOpenFullText } from "./sources/openaccess.mjs";
import { chineseSearchPortals } from "./sources/chinese.mjs";

const [command = "search", ...args] = process.argv.slice(2);
const limitIndex = args.indexOf("--limit");
const limit = limitIndex >= 0 ? Number(args[limitIndex + 1]) : 10;
const positional = args.filter((_, index) => index !== limitIndex && index !== limitIndex + 1);
const query = positional.join(" ").trim();

let result;
if (command === "search") result = await searchLiterature(query, { limit });
else if (command === "trials") result = await searchClinicalTrials(query, { limit });
else if (command === "fulltext") result = await resolveOpenFullText({ doi: query.includes("/") ? query : undefined, pmid: query.includes("/") ? undefined : query });
else if (command === "portals") result = chineseSearchPortals({ query, includeGateway: false });
else throw new Error(`Unknown command: ${command}`);

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

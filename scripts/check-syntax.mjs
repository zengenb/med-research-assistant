import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else if (entry.name.endsWith(".mjs")) result.push(path);
  }
  return result;
}

function check(path) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--check", path], { stdio: "inherit" });
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Syntax check failed: ${path}`)));
  });
}

for (const path of await files(fileURLToPath(new URL("../src", import.meta.url)))) await check(path);
for (const path of await files(fileURLToPath(new URL("./", import.meta.url)))) {
  if (!path.endsWith("check-syntax.mjs")) await check(path);
}
console.log("Syntax checks passed");

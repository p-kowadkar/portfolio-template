// simli-client@3.0.2's own dist/index.{js,d.ts} does `require("./Client")` /
// `from './Client'`, but the compiled file on disk is dist/client.js (lowercase).
// macOS's case-insensitive filesystem hides this; Rollup on Linux (Vercel) does not
// and fails the build with "Could not resolve './Client'". Upstream packaging bug —
// this is a build-time correction, not a change to our own code. Safe to run
// repeatedly: no-ops once the file already says './client'.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const targets = [
  "node_modules/simli-client/dist/index.js",
  "node_modules/simli-client/dist/index.d.ts",
];

for (const path of targets) {
  if (!existsSync(path)) continue;
  const before = readFileSync(path, "utf8");
  const after = before.replace(/(\.\/)Client\b/g, "$1client");
  if (after !== before) {
    writeFileSync(path, after);
    console.log(`fix-simli-client-casing: patched ${path}`);
  }
}

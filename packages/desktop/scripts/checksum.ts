import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("usage: bun scripts/checksum.ts <installer-or-archive>");
  process.exit(1);
}

const hash = createHash("sha256").update(await readFile(file)).digest("hex");
const target = `${file}.sha256`;
await writeFile(target, `${hash}  ${path.basename(file)}\n`, "utf-8");
console.log(`sha256 ${hash}\n${target}`);

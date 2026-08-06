import { createHash } from "node:crypto";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const EXPECTED_SHA256 = "f4f26bad9401df87473a2770cf5d9d4e5c56c89ee5ccb9458725cc2d9cbb809c";
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const bundlePath = join(scriptDirectory, ".bootstrap-source.tar.gz.b64");
const archivePath = join(tmpdir(), `tanzer-communications-${process.pid}.tar.gz`);

const encoded = (await readFile(bundlePath, "utf8")).replace(/\s+/g, "");
const archive = Buffer.from(encoded, "base64");
const actualSha256 = createHash("sha256").update(archive).digest("hex");

if (actualSha256 !== EXPECTED_SHA256) {
  throw new Error(`Source bundle checksum mismatch: ${actualSha256}`);
}

await writeFile(archivePath, archive, { mode: 0o600 });
try {
  const result = spawnSync("tar", ["-xzf", archivePath, "-C", repositoryRoot], {
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`tar exited with status ${result.status}`);
} finally {
  await unlink(archivePath).catch(() => {});
}

console.log("Tanzer Communications Suite v1 expanded and checksum-verified.");
console.log("Next: cd communications-suite && npm run check");

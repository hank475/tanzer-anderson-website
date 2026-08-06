import { createHash } from "node:crypto";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ARCHIVE_SHA256 = "cbec0ba542ca886103f2303a22ac0dde38d66e27b0165fddad2c5e30071afefb";
const PARTS = [
  ["part-00.b64", "7db1431fa355bf2a64d5977add9734cf77af4eb0773b4c6082f75d58f4633d03"],
  ["part-01.b64", "214ba523770a5bbfa8846950c805a49b8263b25c55bec6f69902b0960f8c5749"],
  ["part-02.b64", "3b226fc623ddfcbbb741d58348e5410ba5fb17f525325214975afa4b182ef10c"],
  ["part-03.b64", "9031b4072288ab9e51483fd817bcbd8b35cdb1b183ccb2a13c5896685bbddc21"],
];

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const partsDirectory = join(scriptDirectory, ".bootstrap-v2");
const archivePath = join(tmpdir(), `tanzer-communications-${process.pid}.tar.xz`);
const chunks = [];

for (const [fileName, expectedSha256] of PARTS) {
  const normalized = (await readFile(join(partsDirectory, fileName), "utf8")).replace(/\s+/g, "");
  const actualSha256 = createHash("sha256").update(normalized, "utf8").digest("hex");
  if (actualSha256 !== expectedSha256) {
    throw new Error(`${fileName} checksum mismatch: ${actualSha256}`);
  }
  chunks.push(normalized);
}

const archive = Buffer.from(chunks.join(""), "base64");
const actualArchiveSha256 = createHash("sha256").update(archive).digest("hex");
if (actualArchiveSha256 !== ARCHIVE_SHA256) {
  throw new Error(`Source archive checksum mismatch: ${actualArchiveSha256}`);
}

await writeFile(archivePath, archive, { mode: 0o600 });
try {
  const result = spawnSync("tar", ["-xJf", archivePath, "-C", repositoryRoot], {
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

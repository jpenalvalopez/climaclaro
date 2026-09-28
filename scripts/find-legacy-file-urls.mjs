import fs from "node:fs/promises";
import path from "node:path";

const dataPath = path.join(process.cwd(), "data", "local-db.json");
const legacyPatterns = ["base44.app/api/apps", "base44.com/logo"];

function scanValue(value, trail, findings) {
  if (typeof value === "string") {
    if (legacyPatterns.some((pattern) => value.includes(pattern))) {
      findings.push({ path: trail.join("."), value });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanValue(item, [...trail, index], findings));
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => scanValue(item, [...trail, key], findings));
  }
}

const db = JSON.parse(await fs.readFile(dataPath, "utf8"));
const findings = [];

for (const [entity, records] of Object.entries(db)) {
  records.forEach((record, index) => {
    scanValue(record, [entity, index, record.id || "no-id"], findings);
  });
}

if (!findings.length) {
  console.log("No legacy Base44 file URLs found.");
} else {
  console.log(`Found ${findings.length} legacy Base44 file URL references:`);
  findings.forEach((finding) => {
    console.log(`- ${finding.path}: ${finding.value}`);
  });
}

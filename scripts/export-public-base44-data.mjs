import fs from "node:fs/promises";
import path from "node:path";

const appId = process.env.VITE_BASE44_APP_ID || "698c54d09e4046a82210a18e";
const baseUrl = process.env.BASE44_EXPORT_URL || "https://base44.app";
const outputPath = path.join(process.cwd(), "data", "local-db.json");

const publicEntities = [
  "BrandPage",
  "ModelPage",
  "PageSection",
  "Product",
  "PromoSlide",
  "Review",
  "Service",
  "SiteSettings",
  "WebContent",
  "WebText",
  "Wizard",
  "WizardOption",
  "WizardStep",
];

const privateFields = new Set(["created_by", "created_by_id", "is_sample"]);

function sanitizeRecord(record) {
  return Object.fromEntries(
    Object.entries(record || {}).filter(([key]) => !privateFields.has(key))
  );
}

async function fetchEntity(entity) {
  const url = `${baseUrl}/api/apps/${appId}/entities/${entity}?limit=1000`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`${entity}: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(sanitizeRecord) : [];
}

const db = {};

for (const entity of publicEntities) {
  db[entity] = await fetchEntity(entity);
  console.log(`${entity}: ${db[entity].length}`);
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(db, null, 2));
console.log(`Wrote ${outputPath}`);

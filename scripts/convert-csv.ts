import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const ZONE_MAP: Record<string, number> = {
  "1_Tres_sous_dotee": 1,
  "2_Sous_dotee": 2,
  "3_intermediaire": 3,
  "4_Tres_dotee": 4,
  "5_Sur_dotee": 5,
};

const csvPath = join(process.cwd(), "zonage-raw.csv");
const outDir = join(process.cwd(), "public", "data");
const outPath = join(outDir, "zonage.json");

const raw = readFileSync(csvPath, "utf-8");
const lines = raw.split("\n");

// Skip first 2 header lines (title + description), line 3 is column headers
const dataLines = lines.slice(3);

const communes = dataLines
  .map((line) => {
    const parts = line.split(";");
    if (parts.length < 3) return null;
    const code = parts[0].trim();
    const nom = parts[1].trim();
    const zoneRaw = parts[2].trim();
    if (!code || !nom) return null;
    const zone = ZONE_MAP[zoneRaw] ?? 0;
    return { code, nom, zone };
  })
  .filter(Boolean);

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(communes));

console.log(`Converted ${communes.length} communes to ${outPath}`);

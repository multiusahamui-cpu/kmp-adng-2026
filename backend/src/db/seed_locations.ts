import fs from "fs";
import path from "path";
import readline from "readline";
import { db } from "./index";
import { locations } from "./schema";
import { sql } from "drizzle-orm";

const SEED_FILE = "kode_lokasi.csv";

// Interface untuk data yang akan diinsert
interface LocationInsert {
  code: string;
  name: string;
  type: string;
  parentCode: string | null;
}

const run = async () => {
  console.log("🚀 Starting Location Seeding...");

  // Fix: Cast process to any to avoid TS errors if types are missing
  const filePath = path.join((process as any).cwd(), SEED_FILE);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    (process as any).exit(1);
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const batchSize = 2000;
  let batch: LocationInsert[] = [];
  let count = 0;

  console.log("📥 Reading CSV...");

  for await (const line of rl) {
    if (!line.trim()) continue;

    // Simple CSV parse: split by comma.
    // Assumption: First column is Code, rest is Name (join back if name has commas)
    const parts = line.split(",");
    const code = parts[0].trim();
    const name = parts.slice(1).join(",").trim().replace(/['"]/g, ""); // Remove quotes

    if (!code) continue;

    // Determine Type & Parent based on dot notation length
    // Province: 2 chars (e.g., 11)
    // City: 5 chars (e.g., 11.01)
    // District: 8 chars (e.g., 11.01.01)
    // Village: 13 chars (e.g., 11.01.01.2001)

    let type = "UNKNOWN";
    let parentCode: string | null = null;

    if (code.length === 2) {
      type = "Province";
      parentCode = null;
    } else if (code.length === 5) {
      type = "City";
      parentCode = code.substring(0, 2);
    } else if (code.length === 8) {
      type = "District";
      parentCode = code.substring(0, 5);
    } else if (code.length > 8) {
      type = "Village";
      parentCode = code.substring(0, 8);
    }

    batch.push({
      code,
      name,
      type,
      parentCode,
    });

    if (batch.length >= batchSize) {
      await insertBatch(batch);
      count += batch.length;
      console.log(`✅ Processed ${count} locations...`);
      batch = [];
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    await insertBatch(batch);
    count += batch.length;
  }

  console.log(`🎉 Seeding Completed! Total: ${count} locations.`);
  (process as any).exit(0);
};

const insertBatch = async (data: LocationInsert[]) => {
  try {
    await db.insert(locations).values(data).onConflictDoNothing();
  } catch (error) {
    console.error("⚠️ Error inserting batch:", error);
  }
};

run().catch((err) => {
  console.error("❌ Fatal Error:", err);
  (process as any).exit(1);
});

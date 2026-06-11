#!/usr/bin/env node

/**
 * Download English Bible data (KJV & Amplified)
 * Converts from various formats to our standard JSON format
 * 
 * Usage: npx ts-node src/scripts/download-english-bibles.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";

const DATA_DIR = path.join(__dirname, "../../data");

// ─── Helper: Download from HTTPS URL ────────────────────────────────────

function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          resolve(data);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

// ─── Download KJV from Public Domain Source ──────────────────────────────────

async function downloadKJV() {
  console.log("\n📥 Downloading King James Version (KJV)...");

  const kjvPath = path.join(DATA_DIR, "en_kjv.json");

  // Check if already exists
  if (fs.existsSync(kjvPath)) {
    console.log("   ✓ KJV already exists at data/en_kjv.json");
    return;
  }

  try {
    // Using BibleJS source - KJV in public domain
    const url = "https://raw.githubusercontent.com/BibleJS/Bible/master/bibles/en_kjv.json";
    console.log(`   Downloading from: ${url}`);

    const data = await downloadFile(url);
    const parsed = JSON.parse(data);

    // Verify it has the expected structure
    if (!Array.isArray(parsed)) {
      throw new Error("Unexpected KJV format");
    }

    fs.writeFileSync(kjvPath, JSON.stringify(parsed, null, 2));
    console.log(`   ✅ KJV saved to data/en_kjv.json (${parsed.length} books)`);
  } catch (err) {
    console.error(`   ❌ Failed to download KJV: ${err instanceof Error ? err.message : String(err)}`);
    console.log("\n   Alternative: Download manually from:");
    console.log("   - https://raw.githubusercontent.com/BibleJS/Bible/master/bibles/en_kjv.json");
    console.log("   - Save to: data/en_kjv.json");
    throw err;
  }
}

// ─── Download ASV (American Standard Version - Public Domain) ──────────────

async function downloadASV() {
  console.log("\n📥 Downloading American Standard Version (ASV)...");

  const asvPath = path.join(DATA_DIR, "en_asv.json");

  if (fs.existsSync(asvPath)) {
    console.log("   ✓ ASV already exists at data/en_asv.json");
    return;
  }

  try {
    const url = "https://raw.githubusercontent.com/scrollmaps/bible_databases/master/json/en_asv.json";
    console.log(`   Downloading from: ${url}`);

    const data = await downloadFile(url);
    const parsed = JSON.parse(data);

    fs.writeFileSync(asvPath, JSON.stringify(parsed, null, 2));
    console.log(`   ✅ ASV saved to data/en_asv.json`);
  } catch (err) {
    console.log(`   ℹ️  ASV download optional - you can add it later`);
  }
}

// ─── Verify Downloads ──────────────────────────────────────

function verifyDownloads() {
  console.log("\n✔️ Verifying downloads...");

  let allGood = true;

  // Check KJV
  const kjvPath = path.join(DATA_DIR, "en_kjv.json");
  if (fs.existsSync(kjvPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(kjvPath, "utf-8"));
      console.log(`   ✅ KJV: ${Array.isArray(data) ? data.length : "unknown"} books`);
    } catch (e) {
      console.log(`   ❌ KJV file is invalid JSON`);
      allGood = false;
    }
  } else {
    console.log(`   ❌ KJV file not found`);
    allGood = false;
  }

  // Check Amharic
  const amPath = path.join(DATA_DIR, "amharic_bible.json");
  if (fs.existsSync(amPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(amPath, "utf-8"));
      console.log(`   ✅ Amharic: ${data.books?.length || "unknown"} books`);
    } catch (e) {
      console.log(`   ❌ Amharic file is invalid JSON`);
    }
  }

  // Check ASV
  const asvPath = path.join(DATA_DIR, "en_asv.json");
  if (fs.existsSync(asvPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(asvPath, "utf-8"));
      console.log(`   ✅ ASV: Ready`);
    } catch (e) {
      console.log(`   ⚠️  ASV file is invalid JSON`);
    }
  } else {
    console.log(`   ℹ️  ASV: Not downloaded (optional)`);
  }

  return allGood;
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("🌍 English Bible Data Downloader");
  console.log("═══════════════════════════════════");
  console.log("This downloads public domain Bible texts for the bot\n");

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  try {
    await downloadKJV();
    await downloadASV();

    const verified = verifyDownloads();

    if (verified) {
      console.log("\n✅ Download complete! Run: npm run seed");
    } else {
      console.log("\n⚠️  Some files missing, but you can still seed what exists");
    }
  } catch (err) {
    console.error("\n❌ Download failed:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

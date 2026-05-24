/**
 * Bible Seeder Script (Supports all 66 books and thematic portions)
 * 
 * Loads full Amharic Bible text from data/amharic_bible.json
 * Loads full English KJV Bible text from data/en_kjv.json
 * Loads thematic portions definitions from data/thematic_portions.json
 * 
 * Compares them by book index, batch-inserts books, chapters, and thematic portions.
 * 
 * Usage: npm run seed
 */

import { db, closeConnection } from "../db";
import { books, bookChapters, thematicPortions } from "../db/schema";
import { eq, and } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "../../data");

interface KjvBook {
  name: string;
  abbrev: string;
  chapters: string[][];
}

interface AmharicBook {
  title: string;
  chapters: Array<{
    chapter: string;
    verses: string[];
  }>;
}

interface PortionRange {
  chapter: number;
  startVerse: number;
  endVerse: number;
}

interface PortionDef {
  sequenceOrder: number;
  themeTag: string;
  titleEn: string;
  titleAm: string;
  ranges: PortionRange[];
}

interface ThematicPortionsDef {
  bookNameEn: string;
  portions: PortionDef[];
}

async function seed() {
  console.log("🌱 Starting complete Bible seeding process...\n");

  const amharicPath = path.join(DATA_DIR, "amharic_bible.json");
  const kjvPath = path.join(DATA_DIR, "en_kjv.json");
  const thematicPath = path.join(DATA_DIR, "thematic_portions.json");

  if (!fs.existsSync(amharicPath) || !fs.existsSync(kjvPath)) {
    throw new Error("Bible data files not found in data/ directory. Run download script first.");
  }

  // 1. Read files and strip BOM
  console.log("📖 Reading JSON files...");
  const amharicRaw = fs.readFileSync(amharicPath, "utf-8").replace(/^\uFEFF/, "");
  const amharicBible = JSON.parse(amharicRaw);
  const amharicBooksList: AmharicBook[] = amharicBible.books;

  const kjvRaw = fs.readFileSync(kjvPath, "utf-8").replace(/^\uFEFF/, "");
  const kjvBooksList: KjvBook[] = JSON.parse(kjvRaw);

  let thematicDefs: ThematicPortionsDef[] = [];
  if (fs.existsSync(thematicPath)) {
    const thematicRaw = fs.readFileSync(thematicPath, "utf-8").replace(/^\uFEFF/, "");
    thematicDefs = JSON.parse(thematicRaw);
    console.log(`  ✓ Loaded thematic definitions for ${thematicDefs.length} books.`);
  }

  // 2. Loop through all 66 books
  console.log("\n📚 Processing all 66 books...");
  for (let i = 0; i < 66; i++) {
    const kjvBook = kjvBooksList[i];
    const amharicBook = amharicBooksList[i];

    if (!kjvBook || !amharicBook) {
      console.warn(`  ⚠️ Missing book alignment at index ${i}`);
      continue;
    }

    const nameEn = kjvBook.name;
    const nameAm = amharicBook.title;
    const keyName = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "_");

    // Check if book exists
    let bookId: number;
    const existing = await db.select().from(books).where(eq(books.keyName, keyName)).limit(1);
    if (existing.length === 0) {
      const inserted = await db.insert(books).values({
        keyName,
        nameEn,
        nameAm,
      }).returning({ id: books.id });
      bookId = inserted[0].id;
      console.log(`  [NEW] Book ${i + 1}/66: ${nameEn} (${nameAm}) [id: ${bookId}]`);
    } else {
      bookId = existing[0].id;
      // Keep names updated
      await db.update(books).set({ nameEn, nameAm }).where(eq(books.id, bookId));
      console.log(`  [OK] Book ${i + 1}/66: ${nameEn} (${nameAm}) [id: ${bookId}]`);
    }

    // --- Seeding Chapters (Batch Insert) ---
    const chaptersToInsert: Array<{
      bookId: number;
      chapterNumber: number;
      contentEn: string;
      contentAm: string;
    }> = [];

    // Fetch existing chapters to prevent duplicates
    const existingChapters = await db.select().from(bookChapters).where(eq(bookChapters.bookId, bookId));
    const existingChapterNumbers = new Set(existingChapters.map(c => c.chapterNumber));

    // Build Amharic chapter lookup
    const amChapterMap = new Map<number, string[]>();
    for (const amCh of amharicBook.chapters) {
      const chNum = parseInt(amCh.chapter, 10);
      if (!isNaN(chNum)) {
        amChapterMap.set(chNum, amCh.verses);
      }
    }

    for (let c = 0; c < kjvBook.chapters.length; c++) {
      const chapterNumber = c + 1;

      // Skip if already seeded
      if (existingChapterNumbers.has(chapterNumber)) {
        continue;
      }

      // English Content: Combine verses with format "1 Verse Text\n2 Verse Text"
      const enVerses = kjvBook.chapters[c] ?? [];
      const contentEn = enVerses
        .map((vText, idx) => `${idx + 1} ${vText}`)
        .join("\n");

      // Amharic Content: Combine verses
      const amVerses = amChapterMap.get(chapterNumber) ?? [];
      const contentAm = amVerses.length > 0
        ? amVerses.map((vText, idx) => `${idx + 1} ${vText}`).join("\n")
        : "(የአማርኛ ትርጉም አልተገኘም)";

      chaptersToInsert.push({
        bookId,
        chapterNumber,
        contentEn,
        contentAm,
      });
    }

    if (chaptersToInsert.length > 0) {
      // Chunk batch insertion to avoid Postgres parameters limit
      const chunkSize = 100;
      for (let offset = 0; offset < chaptersToInsert.length; offset += chunkSize) {
        const chunk = chaptersToInsert.slice(offset, offset + chunkSize);
        await db.insert(bookChapters).values(chunk);
      }
      console.log(`    ✓ Batch inserted ${chaptersToInsert.length} chapters.`);
    } else {
      console.log(`    ✓ Chapters already up to date.`);
    }

    // --- Seeding Thematic Portions ---
    const bookThematicDef = thematicDefs.find(
      tDef => tDef.bookNameEn.toLowerCase() === nameEn.toLowerCase()
    );

    if (bookThematicDef) {
      console.log(`    🎨 Seeding ${bookThematicDef.portions.length} thematic portions for ${nameEn}...`);

      for (const pDef of bookThematicDef.portions) {
        let combinedEn = "";
        let combinedAm = "";
        const descParts: string[] = [];

        for (const range of pDef.ranges) {
          const chNum = range.chapter;
          const startV = range.startVerse;
          const endV = range.endVerse;

          descParts.push(`${chNum}:${startV}-${endV}`);

          // English extraction
          const enChVerses = kjvBook.chapters[chNum - 1] ?? [];
          const extractedEn = enChVerses
            .slice(startV - 1, endV)
            .map((vText, idx) => `${startV + idx} ${vText}`)
            .join("\n");
          if (combinedEn) combinedEn += "\n\n";
          combinedEn += extractedEn;

          // Amharic extraction
          const amChVerses = amChapterMap.get(chNum) ?? [];
          const extractedAm = amChVerses
            .slice(startV - 1, endV)
            .map((vText, idx) => `${startV + idx} ${vText}`)
            .join("\n");
          if (combinedAm) combinedAm += "\n\n";
          combinedAm += extractedAm;
        }

        const rangeDesc = descParts.join(", ");

        // Upsert portion
        const existingPortion = await db.select().from(thematicPortions).where(
          and(
            eq(thematicPortions.bookId, bookId),
            eq(thematicPortions.sequenceOrder, pDef.sequenceOrder)
          )
        ).limit(1);

        if (existingPortion.length === 0) {
          await db.insert(thematicPortions).values({
            bookId,
            sequenceOrder: pDef.sequenceOrder,
            themeTag: pDef.themeTag,
            titleEn: pDef.titleEn,
            titleAm: pDef.titleAm,
            verseRangeDescription: rangeDesc,
            contentEn: combinedEn,
            contentAm: combinedAm,
          });
          console.log(`      ✓ Added portion: "${pDef.titleEn}" (${rangeDesc})`);
        } else {
          await db.update(thematicPortions).set({
            themeTag: pDef.themeTag,
            titleEn: pDef.titleEn,
            titleAm: pDef.titleAm,
            verseRangeDescription: rangeDesc,
            contentEn: combinedEn,
            contentAm: combinedAm,
          }).where(eq(thematicPortions.id, existingPortion[0].id));
          console.log(`      ✓ Updated portion: "${pDef.titleEn}" (${rangeDesc})`);
        }
      }
    }
  }

  console.log("\n✅ Database seeding successfully completed!");
  await closeConnection();
}

seed().catch((err) => {
  console.error("❌ Seed process failed:", err);
  closeConnection().catch(console.error);
  process.exit(1);
});

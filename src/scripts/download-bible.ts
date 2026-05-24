import * as fs from "fs";
import * as path from "path";
import * as https from "https";

const DATA_DIR = path.join(__dirname, "../../data");

const BOOK_MAP = [
  { keyName: "psalms", kjvFileName: "Psalms.json" },
  { keyName: "genesis", kjvFileName: "Genesis.json" },
  { keyName: "matthew", kjvFileName: "Matthew.json" },
  { keyName: "proverbs", kjvFileName: "Proverbs.json" },
  { keyName: "john", kjvFileName: "John.json" },
];

function fetchJSON(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "FeedMeBibleBot/1.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJSON(res.headers.location!).then(resolve, reject);
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function downloadIfMissing(url: string, filePath: string): Promise<void> {
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ Already cached: ${path.basename(filePath)}`);
    return;
  }
  console.log(`  ⬇ Downloading: ${url}`);
  try {
    const data = await fetchJSON(url);
    fs.writeFileSync(filePath, data, "utf-8");
    console.log(`  ✓ Saved: ${path.basename(filePath)}`);
  } catch (err) {
    console.error(`  ❌ Failed to download ${url}:`, err);
  }
}

async function main() {
  console.log("🌱 Downloading Bible JSON files to data/ folder...");
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Download Amharic Bible
  const amharicFilePath = path.join(DATA_DIR, "amharic_bible.json");
  await downloadIfMissing(
    "https://raw.githubusercontent.com/magna25/amharic-bible-json/main/amharic_bible.json",
    amharicFilePath
  );

  // Download KJV Books
  for (const book of BOOK_MAP) {
    const kjvPath = path.join(DATA_DIR, book.kjvFileName);
    await downloadIfMissing(
      `https://raw.githubusercontent.com/aruljohn/Bible-kjv-1611/main/${encodeURIComponent(book.kjvFileName)}`,
      kjvPath
    );
  }
  console.log("✨ Done!");
}

main().catch(console.error);

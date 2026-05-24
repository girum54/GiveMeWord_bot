const fs = require("fs");
const path = require("path");
const https = require("https");

const DATA_DIR = path.join(__dirname, "../../data");

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "FeedMeBibleBot/1.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJSON(res.headers.location).then(resolve, reject);
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function downloadIfMissing(url, filePath) {
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
  console.log("🌱 Downloading full Bible JSON files (all 66 books) to data/ folder...");
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 1. Download Amharic Bible (all 66 books in one file)
  const amharicFilePath = path.join(DATA_DIR, "amharic_bible.json");
  await downloadIfMissing(
    "https://raw.githubusercontent.com/magna25/amharic-bible-json/main/amharic_bible.json",
    amharicFilePath
  );

  // 2. Download KJV English Bible (all 66 books in one file)
  const kjvFilePath = path.join(DATA_DIR, "en_kjv.json");
  await downloadIfMissing(
    "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json",
    kjvFilePath
  );

  console.log("✨ Done!");
}

main().catch(console.error);

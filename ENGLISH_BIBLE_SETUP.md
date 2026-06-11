# Adding English Bible Data (KJV & Amplified)

The bot system is ready for English Bible versions, but we need to download/format the actual text. Here are the easiest options:

## Option 1: Download from Free Sources (Recommended)

### King James Version (KJV)
The KJV is in public domain. Download options:

**Option A: From GitHub (Easiest)**
```bash
# Download KJV Bible in JSON format
wget https://raw.githubusercontent.com/BibleJS/Bible/master/bibles/en_kjv.json -O data/kjv_bible.json

# Or using PowerShell
$url = "https://raw.githubusercontent.com/BibleJS/Bible/master/bibles/en_kjv.json"
Invoke-WebRequest -Uri $url -OutFile "data/kjv_bible.json"
```

**Option B: Alternative GitHub source**
```bash
# From another reliable source
wget https://raw.githubusercontent.com/scrollmaps/bible_databases/master/json/en_kjv.json -O data/kjv_bible.json
```

### Amplified Bible
The Amplified Bible is copyrighted, so it's harder to get for free. Options:

**Option A: YouVersion API (Free, Limited)**
- Sign up at https://developer.youversion.com
- Use their API to get Amplified Bible verses
- Requires API key but free tier available

**Option B: Find Pre-formatted JSON**
```bash
# Some GitHub repos have it (verify license)
wget https://raw.githubusercontent.com/CrosswireModules/sword-modules/master/[search for amplified]
```

**Option C: Manual/Commercial**
- Purchase from Logos/Faithlife
- Request bulk data export
- Format according to our schema

## Option 2: Create Your Own JSON Format

If you have raw Bible text, convert it to our format. Create a file `data/kjv_bible.json`:

```json
{
  "title": "King James Version",
  "books": [
    {
      "title": "Genesis",
      "abbv": "Gen",
      "chapters": [
        {
          "chapter": 1,
          "title": "Creation",
          "verses": [
            "In the beginning God created the heaven and the earth. And the earth was without form...",
            "And God said, Let there be light: and there was light..."
          ]
        },
        {
          "chapter": 2,
          "verses": [
            "Thus the heavens and the earth were finished...",
            "And on the seventh day God ended his work..."
          ]
        }
      ]
    },
    {
      "title": "Exodus",
      "abbv": "Exo",
      "chapters": [
        {
          "chapter": 1,
          "verses": ["Now these are the names of the children of Israel...", "..."]
        }
      ]
    }
  ]
}
```

## Step-by-Step Setup

### 1. Download KJV (If using GitHub source)
```bash
cd data
# Using PowerShell
$url = "https://raw.githubusercontent.com/BibleJS/Bible/master/bibles/en_kjv.json"
$outFile = "kjv_bible.json"
try {
    Invoke-WebRequest -Uri $url -OutFile $outFile
    Write-Host "✅ Downloaded KJV successfully"
} catch {
    Write-Host "❌ Download failed: $_"
}
cd ..
```

### 2. Verify Format
```bash
# Check if the JSON is valid
node -e "const data = require('./data/kjv_bible.json'); console.log('Books:', data.books.length)"
```

### 3. Get Amplified (If available)
Similar process as KJV, or use YouVersion API

### 4. Update Seed Script
Once you have the JSON files, we need to update `src/scripts/seed.ts` to populate them into the database.

## Database Schema for English Data

The database already supports storing English Bible content:

```typescript
export const bookChapters = pgTable(
  "book_chapters",
  {
    id: serial("id").primaryKey(),
    bookId: integer("book_id").notNull(),
    chapterNumber: integer("chapter_number").notNull(),
    contentEn: text("content_en").notNull(),  // ← Stores English
    contentAm: text("content_am").notNull(),  // ← Stores Amharic
  }
);
```

## Files Needed

Create these in `data/`:
- `kjv_bible.json` — King James Version (JSON format)
- `amplified_bible.json` — Amplified Bible (JSON format)
- `amharic_bible.json` — Already have this ✅

## API Alternative (YouVersion)

If you prefer to fetch from YouVersion (requires API key):

```typescript
// Example: Fetch and cache Bible content
import axios from 'axios';

async function fetchBibleFromYouVersion(version: string) {
  const response = await axios.get(
    `https://www.youversion.com/bible/${version}`,
    { headers: { 'Accept': 'application/json' } }
  );
  return response.data;
}
```

## Testing

Once you have the data files:

```bash
# Run seed to populate database
npm run seed

# Verify in database
psql givemeword_bot -c "SELECT * FROM books WHERE name_en IS NOT NULL;"
```

## Free Bible JSON Sources

These GitHub repos have free Bible data in JSON:

| Source | Version | License | URL |
|--------|---------|---------|-----|
| BibleJS | KJV | Public Domain | https://github.com/BibleJS/Bible |
| Scroll Maps | Multiple | Public Domain | https://github.com/scrollmaps/bible_databases |
| Bible API | Various | MIT | https://github.com/7-docs/bible |

## Recommended Steps

1. **Download KJV** — Use GitHub source (easiest, legal)
2. **For Amplified** — Either:
   - Find a free JSON source
   - Use YouVersion API (requires signup)
   - Use a different English version that's free (ASV, WEB, etc.)
3. **Update seed script** — Import the JSON files into database
4. **Test** — Run `/test_deliver` and verify English text appears

## License Notes

- **KJV** — Public Domain ✅ (Use freely)
- **Amplified** — Copyrighted ⚠️ (Need permission or find free alternative)
- **ASV/WEB** — Public Domain ✅ (Good alternatives)
- **NRSV/NIV** — Copyrighted ⚠️ (Need permission)

## Next: Update Seed Script

Once you have the data files in `data/`, let me know and I'll update the seed script to:
1. Load KJV/Amplified JSON
2. Parse and insert into database
3. Map to correct language column (`contentEn` vs `contentAm`)

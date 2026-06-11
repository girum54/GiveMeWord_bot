# How to Add English Bible Data

The bot is ready for English Bible versions (KJV and Amplified), but the data files need to be obtained. Here are your options:

## Option 1: Use Free Public Domain Bible API (Recommended)

The easiest way is to use an existing Bible API that provides KJV for free.

### Using Bible API

```bash
# Download KJV using the Bible API
powershell -Command @"
\$url = 'https://www.bible-api.com/books?translation=almeida'
# Alternative: Use ESV API (ESV is public domain in text form)
# Or download from a simpler source below
"@
```

## Option 2: Use a Simple Web Source (Easiest Alternative)

Create the files with publicly available Bible text. Here are some reliable sources:

### KJV Sources:
1. **Internet Archive** - Has downloadable Bible texts
   - Go to: https://archive.org/details/bibles
   - Download a KJV text file

2. **Public Domain Bibles Online** - https://www.kingjamesbibleonline.org/
   - Has full KJV available (public domain)

3. **Bible Gateway** - Has downloadable formats
   - https://www.biblegateway.com/ (check their licensing)

### Format: Convert Raw Bible Text to JSON

Once you have raw Bible text, convert it to our format using this helper:

```bash
# Create en_kjv.json manually or use a converter
# Format should be an array of 66 books, each with chapters and verses
```

## Option 3: Manual File Creation (Simplest for Testing)

For now, create a simple test file to verify the system works:

```bash
# Create data/en_kjv.json with minimal test data
cat > data/en_kjv.json << 'EOF'
[
  {
    "name": "Genesis",
    "abbrev": "Gen",
    "chapters": [
      [
        "In the beginning God created the heaven and the earth.",
        "And the earth was without form, and void; and darkness was upon the face of the deep: and the Spirit of God moved upon the face of the waters.",
        "And God said, Let there be light: and there was light."
      ],
      [
        "Thus the heavens and the earth were finished, and all the host of them.",
        "And on the seventh day God ended his work which he had made; and he rested on the seventh day from all his work which he had made."
      ]
    ]
  }
]
EOF
```

## Step-by-Step: Add English Bibles

### Step 1: Get Bible Data Files

Choose one of these approaches:

**A) Use Existing Open Source Bible Repositories**
```bash
cd data

# Try YouVersion/BibleAPI for public domain versions
# Or download from public archives
```

**B) Create Minimal Test Files**
```bash
# Create simple test versions to verify system works
# (see "Option 3" above)
```

**C) Purchase/Download Licensed Versions**
- Logos Bible Software
- Accordance
- YouVersion Developer API (https://developer.youversion.com)

### Step 2: Format as JSON (if needed)

Our system expects this format for books:

```json
[
  {
    "name": "Genesis",
    "abbrev": "Gen", 
    "chapters": [
      ["Verse 1", "Verse 2", "Verse 3"],  // Chapter 1
      ["Verse 1", "Verse 2", "Verse 3"]   // Chapter 2
    ]
  },
  {
    "name": "Exodus",
    "abbrev": "Exo",
    "chapters": [[...], [...]]
  }
]
```

### Step 3: Save Files

Place your Bible data files in these locations:
- `data/en_kjv.json` — King James Version
- `data/en_asv.json` — American Standard Version (or alternative)

### Step 4: Update Seed Script (if using different format)

If your files have a different structure, update `src/scripts/seed.ts` to match.

### Step 5: Seed into Database

Once files are ready:
```bash
npm run seed
```

## Complete File List Needed

After setup, your `data/` folder should contain:
```
data/
├── amharic_bible.json ✅ (already have - 5.7 MB)
├── en_kjv.json ← (need to get - ~3-5 MB)
└── individual_books/ (original files)
```

## Where to Actually Get Bible Data

### Free/Open Source Options:

1. **ESV Bible API**
   - https://api.esv.org/
   - Requires registration but free tier available

2. **Open Bible Project**
   - https://openbibleinfo.org/
   - Public domain data available

3. **Wikisource Bible**
   - https://en.wikisource.org/wiki/Bible_(King_James_Version)
   - Full KJV text (public domain)

4. **Digital Bible Platform**
   - https://app.dbp.dev/
   - Various translations available

5. **GitHub Bible Repositories**
   - Search "bible" on GitHub
   - Many public domain repositories available
   - License varies - verify before use

### Paid/Licensed Options:

1. **YouVersion API** (Recommended for features)
   - https://developer.youversion.com
   - Official, reliable, various translations
   - Free tier available

2. **Logos/Faithlife**
   - Premium Bible software
   - Contact for bulk data export

3. **Accordance**
   - Professional Bible software
   - Available for commercial use

## Testing Without Full Data

For testing purposes, you can:

1. Create minimal test file (few chapters)
2. Run `npm run seed`
3. Test bot with `/test_deliver`
4. Replace with full data later

The seed script is smart enough to handle partial data.

## Verification

After seeding, verify data was loaded:

```bash
# Connect to PostgreSQL
psql givemeword_bot

# Check how many books loaded
SELECT COUNT(*) FROM books WHERE name_en IS NOT NULL;

# Check chapters loaded
SELECT book_id, COUNT(*) FROM book_chapters WHERE content_en IS NOT NULL GROUP BY book_id LIMIT 5;
```

## Next Steps

1. ✅ Find/download Bible data (see options above)
2. ✅ Save as `data/en_kjv.json` (and optionally `en_asv.json`)
3. ✅ Run `npm run seed`
4. ✅ Run `npm run dev`
5. ✅ Test in Telegram: `/test_deliver` with English selected

## Support Resources

- [Seed Script](src/scripts/seed.ts) — How data is processed
- [Database Schema](src/db/schema.ts) — Where English content stored
- [ENGLISH_BIBLE_SETUP.md](ENGLISH_BIBLE_SETUP.md) — Technical details

## File Format Examples

### Minimal Test Data (10 verses KJV Genesis)
```json
[
  {
    "name": "Genesis",
    "abbrev": "Gen",
    "chapters": [
      [
        "In the beginning God created the heaven and the earth.",
        "And the earth was without form, and void; and darkness was upon the face of the deep: and the Spirit of God moved upon the face of the waters.",
        "And God said, Let there be light: and there was light.",
        "And God saw the light, that it was good: and God divided the light from the darkness.",
        "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.",
        "And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.",
        "And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.",
        "And God called the firmament Heaven. And the evening and the morning were the second day.",
        "And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.",
        "And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good."
      ]
    ]
  }
]
```

---

**Once you have the `en_kjv.json` file in place, run:**

```bash
npm run seed
npm run dev
```

Then test in Telegram with `/test_deliver` and select English Bible!

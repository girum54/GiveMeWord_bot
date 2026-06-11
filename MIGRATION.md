# Give Me Word Bot — Migration Guide

## Overview
This guide helps you upgrade from the previous bot version to the new version with working auto-send, language selection, and Bible version support.

## What Changed

### Code Changes
- ✅ Added scheduler service for auto-send functionality
- ✅ Updated database schema (new columns added)
- ✅ Updated all commands and callbacks
- ✅ Complete localization in English and Amharic
- ✅ Added test command for debugging

### Database Changes
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN bible_version VARCHAR(50) DEFAULT 'amharic';
ALTER TABLE users ADD COLUMN last_delivery_date DATE;
```

### New Dependencies
- BullMQ is already in `package.json` — no new npm packages needed!
- You need Redis server running (not installed via npm)

## Migration Steps

### Step 1: Backup Your Database
```bash
# PostgreSQL backup
pg_dump givemeword_bot > backup_before_update.sql
```

### Step 2: Update Code
```bash
# Pull the latest changes
git pull origin main

# Or manually copy all files from the updated version
```

### Step 3: Update Dependencies
```bash
npm install
```

### Step 4: Run Database Migrations
```bash
# This will add the new columns to users table
npm run db:push
```

### Step 5: Setup Redis
You need Redis running for the scheduler to work:

**Option A: Install Redis locally**
```bash
# Windows (WSL)
sudo apt-get install redis-server
redis-server

# macOS
brew install redis
redis-server

# Linux
sudo apt-get install redis-server
redis-server
```

**Option B: Docker**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Option C: Check if running**
```bash
redis-cli ping
# Should return: PONG
```

### Step 6: Update .env File
Add Redis configuration:
```env
BOT_TOKEN=your_token
DATABASE_URL=postgresql://user:password@localhost:5432/givemeword_bot
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Step 7: Test the Bot
```bash
npm run dev
```

Then:
1. Send `/start` to the bot
2. Choose language (English or Amharic)
3. Choose Bible version (Amharic, KJV, or Amplified)
4. Choose commitment level
5. Set delivery time
6. Try `/test_deliver` to verify it works

## Key Features Now Working

| Feature | How to Test |
|---------|-------------|
| Auto-send | Set delivery time, wait for message at that time |
| Language selection | Go through `/start` flow, try both languages |
| Bible version | Check `/settings` after setup |
| Time remembering | Change time in `/settings`, bot should respect it |
| Test delivery | Use `/test_deliver` command anytime |

## Database Structure Updates

### users table
```typescript
{
  // ... existing fields ...
  locale: "am" | "en",           // Default: "am" (was "en")
  bibleVersion: "amharic" | "kjv" | "amplified",  // NEW
  targetDeliveryTime: "HH:MM:SS",
  lastDeliveryDate: Date | null,  // NEW (tracks daily deliveries)
}
```

## Scheduler Architecture

### How It Works
1. **Scheduler starts** when bot initializes
2. **Every minute**, it checks all users' preferences
3. **For each user**, compares current UTC+3 time with their `targetDeliveryTime`
4. **If time matches** and they haven't received today:
   - Get all their active reading tracks
   - Send each one's current scripture
   - Update `lastDeliveryDate`
5. **Logs** all activity for debugging

### Scheduler Logs
Look for these in your console:
```
🔍 Checking deliveries at UTC+3 time: 07:30
📤 Delivering to user 123456789 at 07:30
✅ Delivery completed for user 123456789
⏭️  User 123456789 already received today's reading
```

## Troubleshooting Migration

### "redis-cli: command not found"
- Redis is not installed
- Install Redis or use Docker
- Check [Step 5](#step-5-setup-redis) above

### "connect ECONNREFUSED 127.0.0.1:6379"
- Redis is not running
- Start Redis server:
  - WSL/Linux: `redis-server`
  - Docker: `docker run -p 6379:6379 redis:latest`

### "column 'bible_version' does not exist"
- Database migration didn't run
- Run: `npm run db:push`
- Or manually run the SQL:
  ```sql
  ALTER TABLE users ADD COLUMN bible_version VARCHAR(50) DEFAULT 'amharic';
  ALTER TABLE users ADD COLUMN last_delivery_date DATE;
  ```

### "Bot starting but no auto-send"
1. Check Redis is running: `redis-cli ping` → should say PONG
2. Check logs for "🔍 Checking deliveries"
3. Verify user has:
   - A valid `targetDeliveryTime` set
   - At least one active reading track
   - `lastDeliveryDate` not set to today
4. Try `/test_deliver` command

### "Scheduler job failed"
- Check logs for specific error
- Common causes:
  - Redis disconnected
  - Database connection lost
  - User record deleted
  - Invalid telegram ID

## Verifying Everything Works

### Checklist
- [ ] Redis is running (`redis-cli ping` returns PONG)
- [ ] Database migrated (`npm run db:push` succeeds)
- [ ] Bot starts without errors (`npm run dev`)
- [ ] `/start` command works
- [ ] Can select language
- [ ] Can select Bible version
- [ ] Can set commitment level
- [ ] Can set delivery time
- [ ] `/test_deliver` sends a message
- [ ] Check logs show scheduler running

### Manual Test
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Bot
npm run dev

# Terminal 3: In Telegram
# Send: /start
# Choose: Amharic → Amharic → Level 1 → 07:00
# Send: /test_deliver
# You should get a scripture message!
```

## Existing Users

Users with old accounts will automatically get:
- `locale`: Their existing language preference
- `bibleVersion`: "amharic" (default)
- `lastDeliveryDate`: null (no previous deliveries tracked)

They can update settings anytime with `/settings`.

## Rollback (If Needed)

If something goes wrong:
```bash
# Restore from backup
psql givemeword_bot < backup_before_update.sql

# Revert code
git revert HEAD
npm install
npm run dev
```

## Performance Notes

- **Scheduler**: Runs every minute, very lightweight
- **Database**: One query per minute to check all users
- **Redis**: Minimal memory usage
- **Bot**: No change in responsiveness

## Next Steps

1. **Verify auto-send works** for at least 24 hours
2. **Test all language combinations**
3. **Add English Bible data** when ready
4. **Monitor logs** for any errors
5. **Update user documentation** with new features

## Support

If issues arise:
1. Check logs for error messages
2. Verify Redis and PostgreSQL are running
3. Check database state: `SELECT telegram_id, locale, bible_version, target_delivery_time, last_delivery_date FROM users;`
4. Test with `/test_deliver` command
5. Review [Troubleshooting](#troubleshooting-migration) section

## File Reference

Key files changed/added:
- `src/services/scheduler.ts` — NEW: Job scheduler
- `src/bot/index.ts` — Updated: Add scheduler init
- `src/bot/commands/start.ts` — Updated: New onboarding flow
- `src/bot/commands/settings.ts` — Updated: Show bible version
- `src/bot/commands/test.ts` — NEW: Test delivery
- `src/bot/callbacks.ts` — Updated: Bible version selection
- `src/db/schema.ts` — Updated: New columns
- `src/locales/en.json` — Updated: New strings
- `src/locales/am.json` — Updated: New strings
- `.env.example` — Updated: Redis config
- `SETUP.md` — NEW: Setup instructions
- `UPDATES.md` — NEW: Feature summary

# 🚀 Give Me Word Bot — Quick Start (5 Minutes)

## Prerequisites Check
- ✅ Node.js v18+ (`node --version`)
- ✅ PostgreSQL running
- ✅ Redis running (`redis-cli ping` → PONG)
- ✅ Telegram Bot Token from @BotFather

## Installation (2 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cat > .env << EOF
BOT_TOKEN=your_token_here
DATABASE_URL=postgresql://user:password@localhost:5432/givemeword_bot
REDIS_HOST=localhost
REDIS_PORT=6379
EOF

# 3. Setup database
npm run db:push

# 4. Start Redis (if not already running)
redis-server &

# 5. Run bot
npm run dev
```

## Testing (2 minutes)

In Telegram:
1. Send `/start`
2. Click language button (e.g., "Amharic")
3. Click Bible version (e.g., "Amharic")
4. Click level "1"
5. Type delivery time: `07:00`
6. Send `/test_deliver` — You should get a scripture!

## ✅ You're Done!

Bot will now send scriptures daily at 7:00 AM UTC+3.

## Common Commands
- `/read` — Get reading now
- `/settings` — Change preferences
- `/help` — All commands
- `/streak` — View progress

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "redis-cli: command not found" | Install Redis or use Docker |
| "Database connection error" | Verify DATABASE_URL, restart psql |
| "BullMQ error" | Ensure Redis is running |
| "No message at scheduled time" | Check `/settings`, try `/test_deliver` |

## Advanced Setup

### Production Deployment
```bash
npm run build
npm start
```

### Docker (Optional)
```bash
docker run -p 6379:6379 redis:latest
# Then run the bot
npm run dev
```

### Logs & Monitoring
```bash
# Watch for scheduler output
npm run dev | grep -E "🔍|📤|✅|❌"
```

## Next Steps

1. **Test auto-send** — Wait for your delivery time or use `/test_deliver`
2. **Add English Bible** — Place JSON files in `data/individual_books/`
3. **Customize** — Modify commands/locales as needed
4. **Deploy** — Follow production deployment steps

## Files You Might Need

| File | Purpose |
|------|---------|
| `.env` | Configuration |
| `src/services/scheduler.ts` | Auto-send logic |
| `src/locales/` | Translations |
| `COMMANDS.md` | Command reference |

---

**That's it!** 🎉 Your bot is now running with auto-send enabled!

For detailed info, see [README.md](README.md)

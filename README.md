# Give Me Word Bot

A Telegram bot that sends you Bible chapters daily based on your chosen level, language, and Bible version.

## 🎯 Features

✅ **Daily Scripture Delivery** — Automatically sends Bible passages at your chosen time (UTC+3 12-hour format)
✅ **Multiple Languages** — Choose between English and Amharic interfaces
✅ **Bible Versions** — Support for Amharic Bible, King James Version (KJV), and Amplified Bible
✅ **Commitment Levels** — Choose 1-5 reading tracks per day (customize your reading pace)
✅ **Reading Tracking** — Track your reading streaks and progress
✅ **Smart Scheduling** — Never misses a day, prevents duplicate sends
✅ **User Preferences** — Customize language, Bible version, commitment level, and delivery time anytime

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis (for scheduling)
- Telegram Bot Token (from @BotFather)

### Installation

1. **Clone/Setup**
   ```bash
   git clone <repo>
   cd GiveMeWord_bot
   npm install
   ```

2. **Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Database**
   ```bash
   npm run db:push
   npm run seed
   ```

4. **Start Redis**
   ```bash
   redis-server
   # or: docker run -p 6379:6379 redis:latest
   ```

5. **Run Bot**
   ```bash
   npm run dev
   ```

## 📱 How to Use

### Onboarding (First Time)
1. Send `/start` to bot
2. Choose your language (English or Amharic)
3. Select Bible version (Amharic, KJV, or Amplified)
4. Choose commitment level (1-5 tracks)
5. Set delivery time (e.g., `07:00` for 7 AM)
6. Done! Bot will send daily readings at your chosen time

### Commands
- `/start` — Begin setup or restart
- `/read` — Get today's reading immediately
- `/next` — Advance to next reading
- `/settings` — View and customize preferences
- `/streak` — Check your reading streak
- `/test_deliver` — Send a test delivery (for debugging)
- `/help` — Show all commands

### Settings
Use `/settings` to change anytime:
- 🌍 Language (English ↔ Amharic)
- 📖 Bible Version (Amharic ↔ KJV ↔ Amplified)
- 📚 Commitment Level (1-5 tracks)
- ⏰ Delivery Time (in 24-hour format)

## 🔧 Architecture

```
Give Me Word Bot
├── Bot (Telegram Interface)
│   ├── Commands (/start, /read, /settings, etc.)
│   ├── Callbacks (Inline keyboard handlers)
│   └── Localization (English/Amharic)
├── Scheduler (BullMQ + Redis)
│   └── Auto-sends at user's chosen time
├── Database (PostgreSQL)
│   ├── Users & preferences
│   ├── Reading progress
│   └── Scripture content
└── Locales (i18n)
    ├── English translations
    └── Amharic translations
```

### Time Handling
- **User Input**: 24-hour format (07:00, 20:30)
- **Storage**: Database TIME type
- **Scheduler**: Checks UTC+3 every minute
- **Display**: 12-hour format to users (7:00 AM, 8:30 PM)

## 📚 Documentation

- **[SETUP.md](SETUP.md)** — Detailed setup instructions
- **[MIGRATION.md](MIGRATION.md)** — Upgrade from older version
- **[UPDATES.md](UPDATES.md)** — What's new and fixed

## 📊 Database Schema

### Main Tables
- `users` — User preferences and settings
- `userActiveTracks` — Reading progress per user
- `books` — Bible book metadata
- `bookChapters` — Chapter content in multiple languages
- `userStreaks` — Reading streak tracking
- `userInteractionLogs` — Engagement metrics

### Key User Fields
```sql
id (serial)
telegramId (bigint) — Unique Telegram user ID
locale ('am' or 'en') — Language preference
bibleVersion ('amharic', 'kjv', 'amplified')
commitmentLevel (1-5) — Reading tracks per day
targetDeliveryTime (HH:MM:SS) — When to send daily
lastDeliveryDate (date) — Last delivery sent
```

## 🤖 Scheduler Details

The bot uses BullMQ with Redis for reliable scheduling:

1. **Initialization** — Scheduler starts when bot starts
2. **Checking** — Every minute, checks all users
3. **Delivery** — When time matches and user hasn't received today:
   - Fetches all user's reading tracks
   - Sends each track's scripture
   - Updates delivery date
4. **Logging** — Tracks all activity for debugging

### Scheduler Logs
```
🔍 Checking deliveries at UTC+3 time: 07:30
📤 Delivering to user 123456789 at 07:30
✅ Delivery completed for user 123456789
```

## 🔍 Troubleshooting

### Bot won't start
- Check `BOT_TOKEN` in `.env`
- Verify Node.js is v18+

### No auto-send messages
- Verify Redis: `redis-cli ping` → PONG
- Check user has delivery time set
- Try `/test_deliver` command
- Look for "🔍 Checking deliveries" in logs

### Database errors
- Ensure PostgreSQL running
- Run `npm run db:push`
- Check `DATABASE_URL` in `.env`

### Scheduler issues
- Redis not running — start with `redis-server`
- Bot process crashed — check logs
- Database connection lost — verify PostgreSQL

## 🌍 Languages

| Language | Code | Support |
|----------|------|---------|
| Amharic | am | ✅ Complete |
| English | en | ✅ Complete |

All UI strings, commands, and help text are translated.

## 📖 Bible Versions

| Version | Status | Notes |
|---------|--------|-------|
| Amharic | ✅ Ready | Full content included |
| KJV | 🔄 Ready for data | Schema supports it |
| Amplified | 🔄 Ready for data | Schema supports it |

English Bible data can be added anytime without code changes.

## 👥 Contributing

To add English Bible data:
1. Get KJV or Amplified Bible text
2. Format as JSON (see `data/individual_books/` for structure)
3. Add to seed script
4. Run `npm run seed`

## 📄 License

ISC

## 🔗 Links

- GitHub: [girum54/GiveMeWord_bot](https://github.com/girum54/GiveMeWord_bot)
- Telegram: [@GiveMeWordBot](https://t.me/GiveMeWordBot)

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#-troubleshooting) section
2. Review logs for error messages
3. Test with `/test_deliver` command
4. Check documentation files

---

**Last Updated**: January 2025
**Version**: 2.0 (Auto-send & Language Support)

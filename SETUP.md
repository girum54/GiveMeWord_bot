# Give Me Word Bot — Setup Guide

## Prerequisites

1. **Node.js** (v18+)
2. **PostgreSQL** (for database)
3. **Redis** (for job scheduling)
4. **Telegram Bot Token** (from @BotFather on Telegram)

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
BOT_TOKEN=your_telegram_bot_token_here

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/givemeword

# Redis (for job scheduling)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Database Setup

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data (Bible books, etc.)
npm run seed
```

### 4. Start Redis Server

Make sure Redis is running:

```bash
# On Windows (if using WSL or installed Redis)
redis-server

# Or using Docker
docker run -p 6379:6379 redis:latest
```

### 5. Run the Bot

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Features

✅ **Daily Scripture Delivery** — Automatic delivery at user's chosen time (UTC+3)
✅ **Multi-Language Support** — Amharic and English interfaces
✅ **Bible Versions** — Amharic, KJV, and Amplified Bible
✅ **Commitment Levels** — 1-5 reading tracks per day
✅ **Reading Tracking** — Track reading streaks and progress
✅ **Customizable Settings** — Change language, bible version, delivery time anytime

## Available Commands

- `/start` — Start setup or restart
- `/read` — Get current reading immediately
- `/next` — Advance to next reading
- `/settings` — View and change preferences
- `/streak` — View reading streak
- `/help` — Show all commands

## Architecture

### Components

1. **Bot** (`src/bot/`) — Telegram bot interface using grammy
2. **Database** (`src/db/`) — PostgreSQL with Drizzle ORM
3. **Scheduler** (`src/services/scheduler.ts`) — BullMQ job queue for daily delivery
4. **Locales** (`src/locales/`) — Multi-language support with i18n
5. **Commands** (`src/bot/commands/`) — All bot commands
6. **Callbacks** (`src/bot/callbacks.ts`) — Inline keyboard handlers

### Time Handling

- **Timezone** — UTC+3 (Africa/Addis_Ababa)
- **User Time Input** — 24-hour format (e.g., 07:00, 20:30)
- **Scheduler** — Checks every minute for users who need delivery
- **Display** — Shows 12-hour format to users (e.g., 7:00 AM, 8:30 PM)

### Onboarding Flow

1. Language Selection → 2. Bible Version → 3. Commitment Level → 4. Delivery Time → 5. Auto-assign Psalms

## Troubleshooting

### Bot not starting
- Ensure BOT_TOKEN is correct
- Check that Node.js version is 18+

### No messages being sent at scheduled time
- Verify Redis is running: `redis-cli ping` (should return PONG)
- Check user's targetDeliveryTime in database
- Ensure bot has been running at the scheduled time

### Database connection errors
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Run migrations: `npm run db:push`

### Schedule not executing
- Redis connection failed — check REDIS_HOST and REDIS_PORT
- BullMQ queue not initialized — check scheduler logs

## Next Steps

1. Download English Bible data (KJV, Amplified)
2. Add data to database via seed script
3. Test with `/read` command
4. Monitor logs for auto-send execution

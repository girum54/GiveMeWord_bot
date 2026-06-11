# Give Me Word Bot — Command Reference

## 📋 Available Commands

### 🚀 Getting Started
**`/start`**
- Initiates onboarding setup
- Walks through: Language → Bible Version → Commitment Level → Delivery Time
- Can be used to restart/reset preferences
- Automatically assigns Psalms as first book

### 📖 Reading Commands
**`/read`**
- Get your current reading(s) immediately
- Shows all reading tracks based on commitment level
- Each track shows: book name, chapter/portion, full text
- Can be used anytime, not just at scheduled delivery

**`/next`**
- Advance to the next reading in your track
- Updates progress in database
- Automatically called after each day's delivery

### ⚙️ Settings & Preferences
**`/settings`**
- View all current preferences
- Shows: Language, Bible Version, Commitment Level, Delivery Time, Timezone
- Access quick buttons to change any setting:
  - 🌍 Language — Switch between English/Amharic
  - 📖 Bible — Choose Amharic/KJV/Amplified
  - 📚 Level — Select 1-5 reading tracks
  - ⏰ Time — Set daily delivery time
  - 🕐 Timezone — View timezone (currently UTC+3)

**`/settings` → Button Actions**
- Language button: Shows EN/AM options
- Bible button: Shows Amharic/KJV/Amplified options
- Level button: Shows 1-5 options
- Time button: Prompts for HH:MM format

### 🔥 Tracking & Achievements
**`/streak`**
- View your reading streak statistics:
  - 📅 Current streak (consecutive days)
  - 🏆 Longest streak (all-time high)
  - 📖 Last read date
- Streaks track consecutive daily reads
- Missing a day breaks the streak (unless grace period available)

### ❓ Help & Information
**`/help`**
- Shows all available commands
- Brief description of each
- Quick reference guide

### 🧪 Testing & Debugging
**`/test_deliver`**
- Sends a test scripture delivery to you right now
- Useful for testing the delivery system without waiting for scheduled time
- Shows all your current reading tracks
- Helps verify bot is working correctly

## 📝 Setting Delivery Time

### Format
- **Input Format**: 24-hour (e.g., `07:00` or `20:30`)
- **Display Format**: 12-hour (e.g., `7:00 AM` or `8:30 PM`)
- **Timezone**: UTC+3 (Africa/Addis_Ababa, Ethiopia time)

### Examples
| What You Send | Bot Displays | What Happens |
|---------------|--------------|--------------|
| `07:00` | 7:00 AM | Gets scripture at 7 AM |
| `12:00` | 12:00 PM | Gets scripture at noon |
| `19:30` | 7:30 PM | Gets scripture at 7:30 PM |
| `23:59` | 11:59 PM | Gets scripture at 11:59 PM |

## 🌍 Supported Languages

### English (🇬🇧)
- Use `/settings` → Language → English
- Entire interface in English
- Bible versions: English (KJV), English (Amplified)
- All help text and messages in English

### Amharic (🇪🇹)
- Use `/settings` → Language → Amharic
- Entire interface in Amharic
- Bible version: Amharic Bible
- All help text and messages in Amharic

## 📚 Bible Versions

### Supported Versions
| Version | Language | Status |
|---------|----------|--------|
| Amharic | Amharic | ✅ Available |
| KJV | English | ✅ Available (when data added) |
| Amplified | English | ✅ Available (when data added) |

### How to Switch
1. Send `/settings`
2. Click "📖 Bible" button
3. Choose your preferred version
4. Future readings will use that version

## 📊 Commitment Levels

### Levels 1-5
- **Level 1**: 1 reading per day
- **Level 2**: 2 readings per day
- **Level 3**: 3 readings per day
- **Level 4**: 4 readings per day
- **Level 5**: 5 readings per day

### How to Change
1. Send `/settings`
2. Click "📚 Level" button
3. Select your desired level
4. Bot will auto-assign books to fill your slots

## 💬 Interaction Flow Examples

### Example 1: First-Time User
```
User: /start
Bot: Shows welcome message
User: Clicks "Amharic" button
Bot: Asks for Bible version
User: Clicks "Amharic" 
Bot: Shows commitment levels
User: Clicks "3"
Bot: Asks for delivery time
User: Types "08:00"
Bot: Setup complete! Psalms assigned to slot 1
```

### Example 2: Changing Settings
```
User: /settings
Bot: Shows current settings
User: Clicks "📖 Bible"
Bot: Shows Bible options
User: Clicks "KJV"
Bot: Bible version updated!
Bot: Shows settings again
```

### Example 3: Reading Daily
```
User: Waits for 8:00 AM UTC+3
Bot: Automatically sends all 3 reading tracks
User: Reads them
Bot: Tracks reading for streak
Next day at 8:00 AM: Bot sends next readings automatically
```

## ⚡ Quick Tips

1. **Don't forget your time zone** - Set in UTC+3 (Ethiopia time)
2. **Test first** - Use `/test_deliver` to verify setup works
3. **Change anytime** - Settings can be updated any time via `/settings`
4. **Multiple reads** - Higher commitment levels mean more verses to read daily
5. **Track progress** - Check `/streak` to see your consistency

## 🐛 Troubleshooting Commands

1. **Bot not responding?**
   - Send `/start` to restart connection
   - Send `/help` to verify bot is alive

2. **Not getting daily delivery?**
   - Check time zone is correct (`/settings`)
   - Check you have active reading tracks (`/read`)
   - Try `/test_deliver` to test system

3. **Settings not saving?**
   - Try `/settings` again
   - Make sure you clicked buttons, didn't just type
   - Try `/start` to redo setup

4. **Reading not advancing?**
   - Use `/next` to manually advance
   - Next day's readings will auto-advance daily

## 📞 Still Need Help?

Check these docs:
- **Main Guide**: `README.md`
- **Setup Instructions**: `SETUP.md`
- **What Changed**: `UPDATES.md`
- **Installation Issues**: `MIGRATION.md`

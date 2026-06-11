import { Queue, Worker } from "bullmq";
import { Bot } from "grammy";
import { db } from "../db";
import { users, userActiveTracks, books, bookChapters, thematicPortions } from "../db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { BotContext } from "../bot";
import { t } from "../locales";
import * as dotenv from "dotenv";

dotenv.config();

// ─── Redis Configuration ────────────────────────────────────────────────────

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// ─── Delivery Queue ─────────────────────────────────────────────────────────

export const deliveryQueue = new Queue("scripture-delivery", { connection: redisConfig });

// ─── Schedule Daily Delivery Check ─────────────────────────────────────────

export async function initializeScheduler(bot: Bot<BotContext>) {
  // Check every minute for users who need delivery
  const worker = new Worker(
    "scripture-delivery",
    async (job) => {
      console.log(`Processing delivery job: ${job.id}`);
      await processDeliveries(bot);
    },
    { connection: redisConfig }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Delivery job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Delivery job ${job?.id} failed:`, err);
  });

  // Add a recurring job that runs every minute to check for deliveries
  await deliveryQueue.add(
    "check-deliveries",
    {},
    {
      repeat: {
        pattern: "* * * * *", // Every minute
      },
    }
  );

  console.log("✅ Scheduler initialized");
}

// ─── Process Deliveries ────────────────────────────────────────────────────

async function processDeliveries(bot: Bot<BotContext>) {
  try {
    // Get all active users
    const allUsers = await db.select().from(users);

    const now = new Date();
    const currentTimeUTC3 = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const currentHourMinute = currentTimeUTC3.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    console.log(`🔍 Checking deliveries at UTC+3 time: ${currentHourMinute}`);

    for (const user of allUsers) {
      // Check if it's time for this user's delivery
      const userTime = user.targetDeliveryTime.substring(0, 5); // HH:MM

      if (userTime === currentHourMinute) {
        // Check if user already received today's delivery
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (user.lastDeliveryDate) {
          const lastDelivery = new Date(user.lastDeliveryDate);
          lastDelivery.setHours(0, 0, 0, 0);

          if (lastDelivery.getTime() === today.getTime()) {
            console.log(`⏭️  User ${user.telegramId} already received today's reading`);
            continue; // Skip, already delivered today
          }
        }

        console.log(`📤 Delivering to user ${user.telegramId} at ${userTime}`);
        await deliverScripturesToUser(bot, user);
      }
    }
  } catch (error) {
    console.error("Error processing deliveries:", error);
  }
}

// ─── Deliver Scriptures to User ────────────────────────────────────────────

export async function deliverScripturesToUser(bot: Bot<BotContext>, user: typeof users.$inferSelect) {
  try {
    const locale = user.locale;

    // Get user's active tracks
    const tracks = await db
      .select()
      .from(userActiveTracks)
      .where(
        and(
          eq(userActiveTracks.userId, user.id),
          eq(userActiveTracks.isCompleted, false)
        )
      );

    if (tracks.length === 0) {
      await bot.api.sendMessage(
        Number(user.telegramId),
        t(locale, "no_active_tracks"),
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Deliver each track
    for (const track of tracks) {
      const book = await db
        .select()
        .from(books)
        .where(eq(books.id, track.bookId))
        .limit(1);

      if (book.length === 0) continue;

      const bookName = locale === "am" ? book[0].nameAm : book[0].nameEn;
      let content = "";
      let modeLabel = "";
      let number = 0;

      if (track.readingMode === "chapter") {
        modeLabel = locale === "am" ? "ምዕራፍ" : "Chapter";
        number = track.currentChapterNumber;

        const chapter = await db
          .select()
          .from(bookChapters)
          .where(
            and(
              eq(bookChapters.bookId, track.bookId),
              eq(bookChapters.chapterNumber, track.currentChapterNumber)
            )
          )
          .limit(1);

        if (chapter.length > 0) {
          content = locale === "am" ? chapter[0].contentAm : chapter[0].contentEn;
        } else {
          content = "📭 No content available for this chapter.";
        }
      } else {
        // thematic mode
        modeLabel = locale === "am" ? "ክፍል" : "Portion";
        number = track.currentThematicSequence;

        const portion = await db
          .select()
          .from(thematicPortions)
          .where(
            and(
              eq(thematicPortions.bookId, track.bookId),
              eq(thematicPortions.sequenceOrder, track.currentThematicSequence)
            )
          )
          .limit(1);

        if (portion.length > 0) {
          content = locale === "am" ? portion[0].contentAm : portion[0].contentEn;
        } else {
          content = "📭 No content available for this portion.";
        }
      }

      // Format message
      const header = `📖 *${bookName}* — ${modeLabel} ${number}\n━━━━━━━━━━━━━━━━━━━━`;
      const footer = `\n━━━━━━━━━━━━━━━━━━━━\n📊 Slot ${track.slotNumber} of ${user.commitmentLevel} | ${modeLabel} mode`;

      const fullMessage = `${header}\n\n${content}${footer}`;

      try {
        if (fullMessage.length <= 4096) {
          await bot.api.sendMessage(Number(user.telegramId), fullMessage, {
            parse_mode: "Markdown",
          });
        } else {
          await bot.api.sendMessage(Number(user.telegramId), header, { parse_mode: "Markdown" });
          const chunks = splitText(content, 4000);
          for (const chunk of chunks) {
            await bot.api.sendMessage(Number(user.telegramId), chunk);
          }
          await bot.api.sendMessage(Number(user.telegramId), footer, { parse_mode: "Markdown" });
        }
      } catch (err) {
        console.error(`Failed to send message to user ${user.telegramId}:`, err);
      }
    }

    // Update last delivery date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    await db
      .update(users)
      .set({ lastDeliveryDate: dateString as any, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    console.log(`✅ Delivery completed for user ${user.telegramId}`);
  } catch (error) {
    console.error(`Error delivering scriptures to user ${user.telegramId}:`, error);
  }
}

// ─── Utility: Split long text ────────────────────────────────────────────

function splitText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    let splitIndex = remaining.lastIndexOf("\n", maxLength);
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = remaining.lastIndexOf(" ", maxLength);
    }
    if (splitIndex === -1) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex).trimStart();
  }

  return chunks;
}

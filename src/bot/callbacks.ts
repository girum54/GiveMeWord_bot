import { Bot, InlineKeyboard } from "grammy";
import { BotContext } from "./index";
import { t } from "../locales";
import { db } from "../db";
import { users, userActiveTracks, books, bookChapters, thematicPortions } from "../db/schema";
import { eq, and } from "drizzle-orm";

export function registerCallbackHandlers(bot: Bot<BotContext>) {
  // ─── Language Selection ──────────────────────────────────────────────────

  bot.callbackQuery(/^set_lang:/, async (ctx) => {
    const locale = ctx.callbackQuery.data.split(":")[1]; // "en" or "am"
    const telegramId = BigInt(ctx.from.id);

    await db
      .update(users)
      .set({ locale, updatedAt: new Date() })
      .where(eq(users.telegramId, telegramId));

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t(locale, "language_set"), {
      parse_mode: "Markdown",
    });

    // If in onboarding, proceed to bible version selection
    if (ctx.session.onboardingStep === "language") {
      const bibleKeyboard = new InlineKeyboard()
        .text(t(locale, "btn_amharic"), "set_bible:amharic")
        .row()
        .text("KJV", "set_bible:kjv")
        .text("Amplified", "set_bible:amplified");

      await ctx.reply(t(locale, "choose_bible_version"), {
        reply_markup: bibleKeyboard,
        parse_mode: "Markdown",
      });

      ctx.session.onboardingStep = "bible_version";
    }
  });

  // ─── Bible Version Selection ─────────────────────────────────────────────

  bot.callbackQuery(/^set_bible:/, async (ctx) => {
    const bibleVersion = ctx.callbackQuery.data.split(":")[1];
    const telegramId = BigInt(ctx.from.id);

    const user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    const locale = user.length > 0 ? user[0].locale : "am";

    await db
      .update(users)
      .set({ bibleVersion, updatedAt: new Date() })
      .where(eq(users.telegramId, telegramId));

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t(locale, "bible_version_set"), {
      parse_mode: "Markdown",
    });

    // If in onboarding, proceed to commitment level
    if (ctx.session.onboardingStep === "bible_version") {
      const keyboard = new InlineKeyboard()
        .text("1", "set_commitment:1")
        .text("2", "set_commitment:2")
        .text("3", "set_commitment:3")
        .text("4", "set_commitment:4")
        .text("5", "set_commitment:5");

      await ctx.reply(t(locale, "choose_commitment"), {
        reply_markup: keyboard,
        parse_mode: "Markdown",
      });

      ctx.session.onboardingStep = "commitment";
    }
  });

  // ─── Commitment Level ────────────────────────────────────────────────────

  bot.callbackQuery(/^set_commitment:/, async (ctx) => {
    const level = parseInt(ctx.callbackQuery.data.split(":")[1], 10);
    const telegramId = BigInt(ctx.from.id);

    // Get current locale
    const user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    const locale = user.length > 0 ? user[0].locale : "en";

    await db
      .update(users)
      .set({ commitmentLevel: level, updatedAt: new Date() })
      .where(eq(users.telegramId, telegramId));

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      t(locale, "commitment_set", { level }),
      { parse_mode: "Markdown" }
    );

    // If in onboarding, proceed to delivery time
    if (ctx.session.onboardingStep === "commitment") {
      await ctx.reply(t(locale, "choose_delivery_time"), {
        parse_mode: "Markdown",
      });
      ctx.session.onboardingStep = "delivery_time";
    }
  });

  // ─── Settings Sub-menus ──────────────────────────────────────────────────

  bot.callbackQuery("settings:language", async (ctx) => {
    const telegramId = BigInt(ctx.from.id);
    const user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    const locale = user.length > 0 ? user[0].locale : "am";

    const keyboard = new InlineKeyboard()
      .text(t(locale, "btn_english"), "set_lang:en")
      .text(t(locale, "btn_amharic"), "set_lang:am");

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t(locale, "choose_language"), {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  });

  bot.callbackQuery("settings:bible", async (ctx) => {
    const telegramId = BigInt(ctx.from.id);
    const user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    const locale = user.length > 0 ? user[0].locale : "am";

    const keyboard = new InlineKeyboard()
      .text(t(locale, "btn_amharic"), "set_bible:amharic")
      .row()
      .text("KJV", "set_bible:kjv")
      .text("Amplified", "set_bible:amplified");

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t(locale, "choose_bible_version"), {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  });

  bot.callbackQuery("settings:level", async (ctx) => {
    const telegramId = BigInt(ctx.from.id);
    const user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    const locale = user.length > 0 ? user[0].locale : "am";

    const keyboard = new InlineKeyboard()
      .text("1", "set_commitment:1")
      .text("2", "set_commitment:2")
      .text("3", "set_commitment:3")
      .text("4", "set_commitment:4")
      .text("5", "set_commitment:5");

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t(locale, "choose_commitment"), {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  });

  bot.callbackQuery("settings:time", async (ctx) => {
    const telegramId = BigInt(ctx.from.id);
    const user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    const locale = user.length > 0 ? user[0].locale : "am";

    await ctx.answerCallbackQuery();
    await ctx.reply(t(locale, "choose_delivery_time"), {
      parse_mode: "Markdown",
    });
  });

  // ─── Delivery Time (text message handler for HH:MM) ──────────────────────

  bot.on("message:text", async (ctx, next) => {
    // Only intercept if waiting for delivery time
    if (ctx.session.onboardingStep === "delivery_time") {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      const text = ctx.message.text.trim();

      const telegramId = BigInt(ctx.from.id);
      const user = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramId))
        .limit(1);

      const locale = user.length > 0 ? user[0].locale : "en";

      if (!timeRegex.test(text)) {
        await ctx.reply(t(locale, "invalid_time"), {
          parse_mode: "Markdown",
        });
        return;
      }

      const timeValue = `${text}:00`; // Convert HH:MM to HH:MM:SS

      await db
        .update(users)
        .set({ targetDeliveryTime: timeValue, updatedAt: new Date() })
        .where(eq(users.telegramId, telegramId));

      await ctx.reply(t(locale, "delivery_time_set", { time: text }), {
        parse_mode: "Markdown",
      });

      // Auto-assign Psalms to slot 1 as the starter book
      if (user.length > 0) {
        const psalms = await db
          .select()
          .from(books)
          .where(eq(books.keyName, "psalms"))
          .limit(1);

        if (psalms.length > 0) {
          // Check if user already has a track in slot 1
          const existingTrack = await db
            .select()
            .from(userActiveTracks)
            .where(
              and(
                eq(userActiveTracks.userId, user[0].id),
                eq(userActiveTracks.slotNumber, 1)
              )
            )
            .limit(1);

          if (existingTrack.length === 0) {
            await db.insert(userActiveTracks).values({
              userId: user[0].id,
              bookId: psalms[0].id,
              slotNumber: 1,
              readingMode: "chapter",
              currentChapterNumber: 1,
              currentThematicSequence: 1,
            });
          }
        }
      }

      await ctx.reply(t(locale, "setup_complete"), {
        parse_mode: "Markdown",
      });
      ctx.session.onboardingStep = "done";
      return;
    }

    // Pass to other handlers if not in onboarding
    await next();
  });
}

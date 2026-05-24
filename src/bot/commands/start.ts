import { Bot, InlineKeyboard } from "grammy";
import { BotContext } from "../index";
import { t } from "../../locales";
import { db } from "../../db";
import { users, userStreaks } from "../../db/schema";
import { eq } from "drizzle-orm";

export function registerStartCommand(bot: Bot<BotContext>) {
  bot.command("start", async (ctx) => {
    const telegramId = BigInt(ctx.from!.id);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    let locale = "en";

    if (existingUser.length === 0) {
      // Create the user
      await db.insert(users).values({
        telegramId,
        username: ctx.from!.username ?? null,
      });

      // Initialize streak record
      const newUser = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramId))
        .limit(1);

      await db.insert(userStreaks).values({
        userId: newUser[0].id,
      });
    } else {
      locale = existingUser[0].locale;
    }

    // Send welcome message
    await ctx.reply(t(locale, "welcome"), { parse_mode: "Markdown" });

    // Show language selection
    const keyboard = new InlineKeyboard()
      .text(t(locale, "btn_english"), "set_lang:en")
      .text(t(locale, "btn_amharic"), "set_lang:am");

    await ctx.reply(t(locale, "choose_language"), {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });

    ctx.session.onboardingStep = "language";
  });
}

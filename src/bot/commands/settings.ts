import { Bot, InlineKeyboard } from "grammy";
import { BotContext } from "../index";
import { t } from "../../locales";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export function registerSettingsCommand(bot: Bot<BotContext>) {
  bot.command("settings", async (ctx) => {
    const telegramId = BigInt(ctx.from!.id);

    const user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (user.length === 0) {
      await ctx.reply("Please use /start first.");
      return;
    }

    const locale = user[0].locale;
    const languageName = locale === "am" ? "አማርኛ" : "English";

    const text = t(locale, "settings_menu", {
      language: languageName,
      level: user[0].commitmentLevel,
      time: user[0].targetDeliveryTime,
      timezone: user[0].timezone,
    });

    const keyboard = new InlineKeyboard()
      .text("🌍 Language", "settings:language")
      .text("📖 Level", "settings:level")
      .row()
      .text("⏰ Time", "settings:time")
      .text("🕐 Timezone", "settings:timezone");

    await ctx.reply(text, {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  });
}

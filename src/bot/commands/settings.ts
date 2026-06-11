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
    const bibleName =
      user[0].bibleVersion === "amharic"
        ? "አማርኛ (Amharic)"
        : user[0].bibleVersion === "kjv"
          ? "KJV"
          : "Amplified";

    // Convert 24-hour time to 12-hour format
    const [hours, minutes] = user[0].targetDeliveryTime.split(":").slice(0, 2);
    const hour24 = parseInt(hours);
    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    const time12 = `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;

    const text = t(locale, "settings_menu", {
      language: languageName,
      bible: bibleName,
      level: user[0].commitmentLevel,
      time: time12,
      timezone: user[0].timezone,
    });

    const keyboard = new InlineKeyboard()
      .text("🌍 Language", "settings:language")
      .text("📖 Bible", "settings:bible")
      .row()
      .text("📚 Level", "settings:level")
      .row()
      .text("⏰ Time", "settings:time")
      .text("🕐 Timezone", "settings:timezone");

    await ctx.reply(text, {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  });
}

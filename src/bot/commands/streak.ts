import { Bot } from "grammy";
import { BotContext } from "../index";
import { t } from "../../locales";
import { db } from "../../db";
import { users, userStreaks } from "../../db/schema";
import { eq } from "drizzle-orm";

export function registerStreakCommand(bot: Bot<BotContext>) {
  bot.command("streak", async (ctx) => {
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

    const streak = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, user[0].id))
      .limit(1);

    const current = streak.length > 0 ? streak[0].currentStreak : 0;
    const longest = streak.length > 0 ? streak[0].longestStreak : 0;
    const lastDate = streak.length > 0 && streak[0].lastEngagementDate
      ? streak[0].lastEngagementDate
      : "—";

    await ctx.reply(
      t(locale, "streak_info", { current, longest, lastDate }),
      { parse_mode: "Markdown" }
    );
  });
}

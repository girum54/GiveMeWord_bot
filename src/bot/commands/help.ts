import { Bot } from "grammy";
import { BotContext } from "../index";
import { t } from "../../locales";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

export function registerHelpCommand(bot: Bot<BotContext>) {
  bot.command("help", async (ctx) => {
    const telegramId = BigInt(ctx.from!.id);

    let locale = "en";
    const user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (user.length > 0) {
      locale = user[0].locale;
    }

    await ctx.reply(t(locale, "help"), { parse_mode: "Markdown" });
  });
}

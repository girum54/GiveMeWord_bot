import { Bot } from "grammy";
import { BotContext } from "../index";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { deliverScripturesToUser } from "../../services/scheduler";

export function registerTestCommand(bot: Bot<BotContext>) {
  bot.command("test_deliver", async (ctx) => {
    // This command sends a test delivery to the user
    // Useful for testing the scheduler without waiting for scheduled time
    
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

    try {
      await ctx.reply("📤 Sending test delivery...");
      await deliverScripturesToUser(bot, user[0]);
      await ctx.reply("✅ Test delivery sent!");
    } catch (error) {
      await ctx.reply(`❌ Error: ${error}`);
      console.error("Test delivery error:", error);
    }
  });
}

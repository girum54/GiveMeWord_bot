import { Bot, Context, session, SessionFlavor } from "grammy";
import * as dotenv from "dotenv";
import { initI18n } from "../locales";
import { registerStartCommand } from "./commands/start";
import { registerReadCommand } from "./commands/read";
import { registerHelpCommand } from "./commands/help";
import { registerSettingsCommand } from "./commands/settings";
import { registerStreakCommand } from "./commands/streak";
import { registerTestCommand } from "./commands/test";
import { registerNextCommand } from "./commands/next";
import { registerCallbackHandlers } from "./callbacks";
import { initializeScheduler } from "../services/scheduler";

dotenv.config();

// ─── Session Data ────────────────────────────────────────────────────────────

export interface SessionData {
  /** Tracks where the user is in the onboarding flow */
  onboardingStep?: "language" | "bible_version" | "commitment" | "delivery_time" | "done";
}

export type BotContext = Context & SessionFlavor<SessionData>;

// ─── Create & Configure Bot ──────────────────────────────────────────────────

export async function createBot(): Promise<Bot<BotContext>> {
  await initI18n();

  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("BOT_TOKEN environment variable is not set");
  }

  const bot = new Bot<BotContext>(token);

  // Session middleware (in-memory for now, move to PostgreSQL for prod)
  bot.use(
    session({
      initial: (): SessionData => ({
        onboardingStep: undefined,
      }),
    })
  );

  // Register all command handlers
  registerStartCommand(bot);
  registerReadCommand(bot);
  registerHelpCommand(bot);
  registerSettingsCommand(bot);
  registerStreakCommand(bot);
  registerTestCommand(bot);
  registerNextCommand(bot);

  // Register inline keyboard callback handlers
  registerCallbackHandlers(bot);

  // Initialize background job scheduler
  await initializeScheduler(bot);

  // Error handler
  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  return bot;
}

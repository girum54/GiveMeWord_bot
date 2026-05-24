import { createBot } from "./bot";

async function main() {
  console.log("🚀 Starting Feed Me Bible Bot...");

  const bot = await createBot();

  // Graceful shutdown
  const shutdown = () => {
    console.log("🛑 Shutting down...");
    bot.stop();
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  // Start the bot using long polling
  await bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Bot @${botInfo.username} is running!`);
    },
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

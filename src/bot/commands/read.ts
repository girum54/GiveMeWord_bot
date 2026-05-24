import { Bot } from "grammy";
import { BotContext } from "../index";
import { t } from "../../locales";
import { db } from "../../db";
import { users, userActiveTracks, bookChapters, thematicPortions, books } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export function registerReadCommand(bot: Bot<BotContext>) {
  bot.command("read", async (ctx) => {
    const telegramId = BigInt(ctx.from!.id);

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (user.length === 0) {
      await ctx.reply("Please use /start first to set up your account.");
      return;
    }

    const locale = user[0].locale;

    // Get active tracks
    const tracks = await db
      .select()
      .from(userActiveTracks)
      .where(
        and(
          eq(userActiveTracks.userId, user[0].id),
          eq(userActiveTracks.isCompleted, false)
        )
      );

    if (tracks.length === 0) {
      await ctx.reply(t(locale, "no_active_tracks"), {
        parse_mode: "Markdown",
      });
      return;
    }

    // Deliver each track's content
    for (const track of tracks) {
      const book = await db
        .select()
        .from(books)
        .where(eq(books.id, track.bookId))
        .limit(1);

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

      // Format and send
      const header = t(locale, "reading_header", { bookName, mode: modeLabel, number });
      const footer = t(locale, "reading_footer", {
        slot: track.slotNumber,
        total: user[0].commitmentLevel,
        mode: modeLabel,
      });

      // Telegram message limit is 4096 chars. Split if needed.
      const fullMessage = `${header}\n\n${content}${footer}`;

      if (fullMessage.length <= 4096) {
        await ctx.reply(fullMessage, { parse_mode: "Markdown" });
      } else {
        // Send header, then content in chunks, then footer
        await ctx.reply(header, { parse_mode: "Markdown" });

        const chunks = splitText(content, 4000);
        for (const chunk of chunks) {
          await ctx.reply(chunk);
        }

        await ctx.reply(footer, { parse_mode: "Markdown" });
      }
    }
  });
}

function splitText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a newline
    let splitIndex = remaining.lastIndexOf("\n", maxLength);
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      // Try space
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

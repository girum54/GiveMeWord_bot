import { Bot } from "grammy";
import { BotContext } from "../index";
import { t } from "../../locales";
import { db } from "../../db";
import { users, userActiveTracks, bookChapters, thematicPortions, books } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export function registerNextCommand(bot: Bot<BotContext>) {
  bot.command("next", async (ctx) => {
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
    const userId = user[0].id;

    // Get active tracks
    const tracks = await db
      .select()
      .from(userActiveTracks)
      .where(
        and(
          eq(userActiveTracks.userId, userId),
          eq(userActiveTracks.isCompleted, false)
        )
      );

    if (tracks.length === 0) {
      await ctx.reply(t(locale, "no_active_tracks"), {
        parse_mode: "Markdown",
      });
      return;
    }

    // Advance each track to the next chapter/portion
    for (const track of tracks) {
      const book = await db
        .select()
        .from(books)
        .where(eq(books.id, track.bookId))
        .limit(1);

      if (book.length === 0) continue;

      if (track.readingMode === "chapter") {
        // Move to next chapter
        const nextChapterNumber = track.currentChapterNumber + 1;
        
        // Check if next chapter exists
        const nextChapter = await db
          .select()
          .from(bookChapters)
          .where(
            and(
              eq(bookChapters.bookId, track.bookId),
              eq(bookChapters.chapterNumber, nextChapterNumber)
            )
          )
          .limit(1);

        if (nextChapter.length > 0) {
          // Update track to next chapter
          await db
            .update(userActiveTracks)
            .set({ currentChapterNumber: nextChapterNumber })
            .where(eq(userActiveTracks.id, track.id));
        } else {
          // Book completed - mark as done
          await db
            .update(userActiveTracks)
            .set({ isCompleted: true })
            .where(eq(userActiveTracks.id, track.id));
        }
      } else {
        // Thematic mode - move to next portion
        const nextSequence = track.currentThematicSequence + 1;
        
        const nextPortion = await db
          .select()
          .from(thematicPortions)
          .where(
            and(
              eq(thematicPortions.bookId, track.bookId),
              eq(thematicPortions.sequenceOrder, nextSequence)
            )
          )
          .limit(1);

        if (nextPortion.length > 0) {
          // Update track to next portion
          await db
            .update(userActiveTracks)
            .set({ currentThematicSequence: nextSequence })
            .where(eq(userActiveTracks.id, track.id));
        } else {
          // Thematic readings completed - mark as done
          await db
            .update(userActiveTracks)
            .set({ isCompleted: true })
            .where(eq(userActiveTracks.id, track.id));
        }
      }
    }

    await ctx.reply("✅ Advanced to next reading! Use /read to see it.");
  });
}

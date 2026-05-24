import {
  pgTable,
  serial,
  bigint,
  varchar,
  integer,
  boolean,
  text,
  timestamp,
  date,
  time,
  unique,
} from "drizzle-orm/pg-core";

// ─── 1. Users & Preferences Core ─────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: bigint("telegram_id", { mode: "bigint" }).unique().notNull(),
  username: varchar("username", { length: 255 }),
  locale: varchar("locale", { length: 10 }).default("en").notNull(),
  commitmentLevel: integer("commitment_level").default(1).notNull(),
  isLeaderboardPublic: boolean("is_leaderboard_public").default(false).notNull(),
  targetDeliveryTime: time("target_delivery_time").default("07:00:00").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("Africa/Addis_Ababa").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── 2. Interaction Telemetry ─────────────────────────────────────────────────

export const userInteractionLogs = pgTable("user_interaction_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  deliveredAt: timestamp("delivered_at").notNull(),
  openedAt: timestamp("opened_at"),
  interactionDurationSeconds: integer("interaction_duration_seconds"),
  dateDimension: date("date_dimension").defaultNow().notNull(),
});

// ─── 3. Scripture Corpus ──────────────────────────────────────────────────────

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  keyName: varchar("key_name", { length: 100 }).unique().notNull(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  nameAm: varchar("name_am", { length: 255 }).notNull(),
});

export const bookChapters = pgTable(
  "book_chapters",
  {
    id: serial("id").primaryKey(),
    bookId: integer("book_id")
      .references(() => books.id, { onDelete: "cascade" })
      .notNull(),
    chapterNumber: integer("chapter_number").notNull(),
    contentEn: text("content_en").notNull(),
    contentAm: text("content_am").notNull(),
  },
  (table) => [unique("uq_book_chapter").on(table.bookId, table.chapterNumber)]
);

export const thematicPortions = pgTable(
  "thematic_portions",
  {
    id: serial("id").primaryKey(),
    bookId: integer("book_id")
      .references(() => books.id, { onDelete: "cascade" })
      .notNull(),
    sequenceOrder: integer("sequence_order").notNull(),
    themeTag: varchar("theme_tag", { length: 100 }).notNull(),
    titleEn: varchar("title_en", { length: 255 }).notNull(),
    titleAm: varchar("title_am", { length: 255 }).notNull(),
    verseRangeDescription: varchar("verse_range_description", { length: 255 }).notNull(),
    contentEn: text("content_en").notNull(),
    contentAm: text("content_am").notNull(),
  },
  (table) => [unique("uq_book_sequence").on(table.bookId, table.sequenceOrder)]
);

// ─── 4. Enrichment Resources ─────────────────────────────────────────────────

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  thematicPortionId: integer("thematic_portion_id").references(
    () => thematicPortions.id,
    { onDelete: "set null" }
  ),
  bookChapterId: integer("book_chapter_id").references(
    () => bookChapters.id,
    { onDelete: "set null" }
  ),
  category: varchar("category", { length: 50 }).notNull(), // 'art', 'music', 'video'
  mediaUrl: text("media_url").notNull(),
  titleEn: varchar("title_en", { length: 255 }),
  titleAm: varchar("title_am", { length: 255 }),
  descriptionEn: text("description_en"),
  descriptionAm: text("description_am"),
  attribution: text("attribution"),
});

// ─── 5. Progress Tracking Engine ──────────────────────────────────────────────

export const userActiveTracks = pgTable(
  "user_active_tracks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    bookId: integer("book_id")
      .references(() => books.id, { onDelete: "cascade" })
      .notNull(),
    slotNumber: integer("slot_number").notNull(),
    readingMode: varchar("reading_mode", { length: 20 }).default("thematic").notNull(),
    currentChapterNumber: integer("current_chapter_number").default(1).notNull(),
    currentThematicSequence: integer("current_thematic_sequence").default(1).notNull(),
    isCompleted: boolean("is_completed").default(false).notNull(),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  },
  (table) => [unique("uq_user_slot").on(table.userId, table.slotNumber)]
);

// ─── 6. Gamification ─────────────────────────────────────────────────────────

export const userStreaks = pgTable("user_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastEngagementDate: date("last_engagement_date"),
  graceWindowUsed: boolean("grace_window_used").default(false).notNull(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  badgeKey: varchar("badge_key", { length: 100 }).unique().notNull(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  nameAm: varchar("name_am", { length: 255 }).notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAm: text("description_am").notNull(),
  levelRequirement: integer("level_requirement").notNull(),
  iconEmoji: varchar("icon_emoji", { length: 50 }).notNull(),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    badgeId: integer("badge_id")
      .references(() => badges.id, { onDelete: "cascade" })
      .notNull(),
    unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  },
  (table) => [unique("uq_user_badge").on(table.userId, table.badgeId)]
);

// ─── 7. Social Accountability & Covenants ─────────────────────────────────────

export const covenants = pgTable("covenants", {
  id: serial("id").primaryKey(),
  groupName: varchar("group_name", { length: 255 }).notNull(),
  inviteCode: varchar("invite_code", { length: 100 }).unique().notNull(),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userCovenants = pgTable(
  "user_covenants",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    covenantId: integer("covenant_id")
      .references(() => covenants.id, { onDelete: "cascade" })
      .notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [unique("uq_user_covenant").on(table.userId, table.covenantId)]
);

export const covenantCommitments = pgTable("covenant_commitments", {
  id: serial("id").primaryKey(),
  covenantId: integer("covenant_id")
    .references(() => covenants.id, { onDelete: "cascade" })
    .notNull(),
  targetBookId: integer("target_book_id")
    .references(() => books.id, { onDelete: "cascade" })
    .notNull(),
  targetReadingMode: varchar("target_reading_mode", { length: 20 }).default("thematic").notNull(),
  targetPortionsCount: integer("target_portions_count").notNull(),
  startDate: date("start_date").defaultNow().notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true).notNull(),
});

// ─── 8. Reminder Logs ────────────────────────────────────────────────────────

export const reminderLogs = pgTable("reminder_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  reminderType: varchar("reminder_type", { length: 50 }).default("soft_ping").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
});

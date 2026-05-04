import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  integer,
  real,
  json,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const roomStatusEnum = pgEnum("room_status", [
  "waiting",
  "in_progress",
  "finished",
  "abandoned",
]);
export const resultTypeEnum = pgEnum("result_type", [
  "completed",
  "forfeit",
  "timeout",
]);

// ─── Better Auth tables ───────────────────────────────────────────────────────

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    // App-specific fields
    username: text("username").unique(),
    elo: integer("elo").default(1200).notNull(),
    bio: text("bio"),
    preferredLanguage: text("preferred_language").default("javascript"),
    country: text("country"),
    linkedin: text("linkedin"),
    twitter: text("twitter"),
    instagram: text("instagram"),
    isBanned: boolean("is_banned").default(false).notNull(),
    lastActiveAt: timestamp("last_active_at"),
  },
  (t) => [index("user_elo_idx").on(t.elo)],
);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── App tables ───────────────────────────────────────────────────────────────

export const problems = pgTable("problems", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  difficulty: difficultyEnum("difficulty").notNull(),
  acceptanceRate: real("acceptance_rate"),
  description: text("description").notNull(),
  examples: json("examples").notNull(),
  constraints: text("constraints"),
  tags: text("tags").array(),
  topicTags: json("topic_tags").$type<{ name: string; slug: string }[]>(),
  hints: json("hints").$type<string[]>(),
  testCases: json("test_cases").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rooms = pgTable(
  "rooms",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    status: roomStatusEnum("status").default("waiting").notNull(),
    problemSlug: text("problem_slug").references(() => problems.slug),
    hostId: text("host_id")
      .notNull()
      .references(() => user.id),
    difficulty: difficultyEnum("difficulty").notNull(),
    timeLimitMinutes: integer("time_limit_minutes").default(30).notNull(),
    matchStartedAt: timestamp("match_started_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => [
    index("rooms_code_idx").on(t.code),
    index("rooms_status_idx").on(t.status),
  ],
);

export const roomPlayers = pgTable("room_players", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
  hasPassed: boolean("has_passed").default(false).notNull(),
  solution: text("solution"),
  language: text("language").notNull(),
  testCasesPassed: integer("test_cases_passed").default(0).notNull(),
  totalTestCases: integer("total_test_cases").default(0).notNull(),
});

export const matches = pgTable(
  "matches",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id),
    winnerId: text("winner_id").references(() => user.id),
    loserId: text("loser_id").references(() => user.id),
    problemSlug: text("problem_slug").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    resultType: resultTypeEnum("result_type").notNull(),
    winnerEloBefore: integer("winner_elo_before"),
    loserEloBefore: integer("loser_elo_before"),
    winnerEloAfter: integer("winner_elo_after"),
    loserEloAfter: integer("loser_elo_after"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("matches_winner_id_idx").on(t.winnerId),
    index("matches_loser_id_idx").on(t.loserId),
  ],
);

export const eloHistory = pgTable("elo_history", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id),
  eloBefore: integer("elo_before").notNull(),
  eloAfter: integer("elo_after").notNull(),
  delta: integer("delta").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

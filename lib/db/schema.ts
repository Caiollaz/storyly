import type { InferSelectModel } from "drizzle-orm";
import {
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import type { Scene, StoryHistoryItem } from "@/lib/types";

// ---------------------------------------------------------------------------
// Auth.js (Drizzle adapter) canonical tables
// ---------------------------------------------------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

// One row per user once they subscribe. Pro is active when status === "active"
// and currentPeriodEnd is in the future.
export const subscriptions = pgTable("subscription", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  abacateSubscriptionId: text("abacateSubscriptionId"),
  status: text("status").$type<"active" | "canceled" | "past_due">().notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd", { mode: "date" }),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const savedGames = pgTable("saved_game", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  genre: text("genre").notNull(),
  storyHistory: jsonb("storyHistory").$type<StoryHistoryItem[]>().notNull(),
  currentScene: jsonb("currentScene").$type<Scene>().notNull(),
  createdAt: timestamp("createdAt", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Per-user counters for free-tier gating.
export const usage = pgTable("usage", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  adventuresStarted: integer("adventuresStarted").notNull().default(0),
  scenesDate: date("scenesDate", { mode: "string" }),
  scenesToday: integer("scenesToday").notNull().default(0),
});

export type Subscription = InferSelectModel<typeof subscriptions>;
export type SavedGameRow = InferSelectModel<typeof savedGames>;
export type Usage = InferSelectModel<typeof usage>;

import { eq, sql } from "drizzle-orm";
import { findPaidSubscription } from "@/lib/abacate";
import { db } from "@/lib/db";
import { savedGames, subscriptions, usage } from "@/lib/db/schema";
import { translations } from "@/lib/i18n/translations";

export const FREE_LIMITS = {
  adventures: 3,
  scenesPerDay: 20,
  saveSlots: 1,
} as const;

// Safety cap for Pro: not advertised, just a backstop against abuse / runaway
// DeepSeek cost from a single account. Adjust freely.
export const PRO_SCENES_PER_DAY = 500;

// Genres available to free users: the basic predefined genres, in every
// language. Anything else (romance genres or a custom typed genre) is premium.
const FREE_GENRE_KEYS = [
  "predefined_fantasy",
  "predefined_cyberpunk",
  "predefined_horror",
  "predefined_detective",
  "predefined_expedition",
] as const;

const FREE_GENRE_VALUES = new Set<string>(
  Object.values(translations).flatMap((t) =>
    FREE_GENRE_KEYS.map((key) => t[key]),
  ),
);

export type GatingCode =
  | "ADVENTURE_LIMIT"
  | "SCENE_LIMIT"
  | "PREMIUM_GENRE"
  | "SAVE_LIMIT";

export class GatingError extends Error {
  code: GatingCode;
  status: number;
  constructor(code: GatingCode) {
    super(code);
    this.name = "GatingError";
    this.code = code;
    this.status = 402; // Payment Required
  }
}

const today = (): string => new Date().toISOString().slice(0, 10);

export async function isPro(userId: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  if (row?.status !== "active") return false;
  if (row.currentPeriodEnd && row.currentPeriodEnd.getTime() < Date.now()) {
    return false;
  }
  return true;
}

// Fallback for a missed `subscription.completed` webhook: if the user isn't Pro
// in our DB, ask AbacatePay whether they have a PAID subscription and, if so,
// activate it locally. Cheap call — invoke on the account page, not hot paths.
// currentPeriodEnd is left null (active until a renew/cancel webhook updates it).
export async function reconcileSubscription(userId: string): Promise<void> {
  if (await isPro(userId)) return;
  let sub: { id: string } | null = null;
  try {
    sub = await findPaidSubscription(userId);
  } catch (error) {
    console.error("[abacate] reconcile failed:", error);
    return;
  }
  if (!sub) return;
  await db
    .insert(subscriptions)
    .values({
      userId,
      abacateSubscriptionId: sub.id,
      status: "active",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        abacateSubscriptionId: sub.id,
        status: "active",
        updatedAt: new Date(),
      },
    });
}

async function getUsage(userId: string) {
  const [row] = await db
    .select()
    .from(usage)
    .where(eq(usage.userId, userId))
    .limit(1);
  return row;
}

export interface Entitlements {
  isPro: boolean;
  adventuresLeft: number | null; // null = unlimited
  scenesLeftToday: number | null;
  saveSlots: number | null;
  canUsePremiumGenres: boolean;
}

export async function getEntitlements(userId: string): Promise<Entitlements> {
  const pro = await isPro(userId);
  if (pro) {
    return {
      isPro: true,
      adventuresLeft: null,
      scenesLeftToday: null,
      saveSlots: null,
      canUsePremiumGenres: true,
    };
  }

  const u = await getUsage(userId);
  const adventuresStarted = u?.adventuresStarted ?? 0;
  const scenesToday = u?.scenesDate === today() ? (u?.scenesToday ?? 0) : 0;

  return {
    isPro: false,
    adventuresLeft: Math.max(0, FREE_LIMITS.adventures - adventuresStarted),
    scenesLeftToday: Math.max(0, FREE_LIMITS.scenesPerDay - scenesToday),
    saveSlots: FREE_LIMITS.saveSlots,
    canUsePremiumGenres: false,
  };
}

export function assertCanUseGenre(genre: string, pro: boolean): void {
  if (pro) return;
  if (!FREE_GENRE_VALUES.has(genre)) {
    throw new GatingError("PREMIUM_GENRE");
  }
}

// Check/record are split so we count usage only AFTER a successful generation
// (a failed DeepSeek call must not burn quota). `record*` use atomic SQL
// increments to avoid lost updates under concurrency.

export async function checkCanStartAdventure(
  userId: string,
  pro: boolean,
): Promise<void> {
  if (pro) return;
  const u = await getUsage(userId);
  if ((u?.adventuresStarted ?? 0) >= FREE_LIMITS.adventures) {
    throw new GatingError("ADVENTURE_LIMIT");
  }
}

export async function recordAdventureStart(
  userId: string,
  pro: boolean,
): Promise<void> {
  if (pro) return;
  await db
    .insert(usage)
    .values({ userId, adventuresStarted: 1 })
    .onConflictDoUpdate({
      target: usage.userId,
      set: { adventuresStarted: sql`${usage.adventuresStarted} + 1` },
    });
}

export async function checkCanGenerateScene(
  userId: string,
  pro: boolean,
): Promise<void> {
  // Both plans are capped (Pro at a much higher safety limit).
  const limit = pro ? PRO_SCENES_PER_DAY : FREE_LIMITS.scenesPerDay;
  const u = await getUsage(userId);
  const scenesToday = u?.scenesDate === today() ? (u?.scenesToday ?? 0) : 0;
  if (scenesToday >= limit) {
    throw new GatingError("SCENE_LIMIT");
  }
}

// Always counts (the Pro safety cap relies on it). pro param kept for symmetry.
export async function recordScene(
  userId: string,
  _pro: boolean,
): Promise<void> {
  const day = today();
  // Atomic: increment within the same day, reset to 1 on a new day.
  await db
    .insert(usage)
    .values({ userId, scenesDate: day, scenesToday: 1 })
    .onConflictDoUpdate({
      target: usage.userId,
      set: {
        scenesDate: day,
        scenesToday: sql`CASE WHEN ${usage.scenesDate} = ${day} THEN ${usage.scenesToday} + 1 ELSE 1 END`,
      },
    });
}

// Enforces the save-slot limit before creating a NEW save. No-op for Pro.
export async function assertCanSave(
  userId: string,
  pro: boolean,
): Promise<void> {
  if (pro) return;
  const rows = await db
    .select({ id: savedGames.id })
    .from(savedGames)
    .where(eq(savedGames.userId, userId));
  if (rows.length >= FREE_LIMITS.saveSlots) {
    throw new GatingError("SAVE_LIMIT");
  }
}

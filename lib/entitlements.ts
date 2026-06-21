import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedGames, subscriptions, usage } from "@/lib/db/schema";
import { translations } from "@/lib/i18n/translations";

export const FREE_LIMITS = {
  adventures: 3,
  scenesPerDay: 20,
  saveSlots: 1,
} as const;

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

// Counts an adventure start against the free quota and increments it. No-op for
// Pro. Throws GatingError("ADVENTURE_LIMIT") when the free limit is reached.
export async function assertCanStartAdventure(
  userId: string,
  pro: boolean,
): Promise<void> {
  if (pro) return;
  const u = await getUsage(userId);
  const started = u?.adventuresStarted ?? 0;
  if (started >= FREE_LIMITS.adventures) {
    throw new GatingError("ADVENTURE_LIMIT");
  }
  await db
    .insert(usage)
    .values({ userId, adventuresStarted: 1 })
    .onConflictDoUpdate({
      target: usage.userId,
      set: { adventuresStarted: started + 1 },
    });
}

// Counts a scene against the daily free quota and increments it. No-op for Pro.
// Throws GatingError("SCENE_LIMIT") when the daily limit is reached.
export async function assertCanGenerateScene(
  userId: string,
  pro: boolean,
): Promise<void> {
  if (pro) return;
  const u = await getUsage(userId);
  const isSameDay = u?.scenesDate === today();
  const scenesToday = isSameDay ? (u?.scenesToday ?? 0) : 0;
  if (scenesToday >= FREE_LIMITS.scenesPerDay) {
    throw new GatingError("SCENE_LIMIT");
  }
  await db
    .insert(usage)
    .values({ userId, scenesDate: today(), scenesToday: 1 })
    .onConflictDoUpdate({
      target: usage.userId,
      set: { scenesDate: today(), scenesToday: scenesToday + 1 },
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

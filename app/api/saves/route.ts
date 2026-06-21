import { and, desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { savedGames } from "@/lib/db/schema";
import { assertCanSave, GatingError, isPro } from "@/lib/entitlements";
import type { Scene, StoryHistoryItem } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(savedGames)
    .where(eq(savedGames.userId, userId))
    .orderBy(desc(savedGames.updatedAt));

  return Response.json({ saves: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, genre, storyHistory, currentScene } = (await req.json()) as {
    id?: string;
    genre: string;
    storyHistory: StoryHistoryItem[];
    currentScene: Scene;
  };

  // Update existing save (must belong to the user).
  if (id) {
    const [updated] = await db
      .update(savedGames)
      .set({ genre, storyHistory, currentScene, updatedAt: new Date() })
      .where(and(eq(savedGames.id, id), eq(savedGames.userId, userId)))
      .returning();
    if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ save: updated });
  }

  // New save — enforce slot limit for free users.
  try {
    await assertCanSave(userId, await isPro(userId));
  } catch (error) {
    if (error instanceof GatingError) {
      return Response.json(
        { error: error.code, code: error.code },
        { status: error.status },
      );
    }
    throw error;
  }

  const [created] = await db
    .insert(savedGames)
    .values({ userId, genre, storyHistory, currentScene })
    .returning();
  return Response.json({ save: created });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  await db
    .delete(savedGames)
    .where(and(eq(savedGames.id, id), eq(savedGames.userId, userId)));
  return Response.json({ ok: true });
}

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { cancelSubscription } from "@/lib/abacate";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { log } from "@/lib/log";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!row?.abacateSubscriptionId) {
    return Response.json({ error: "No active subscription." }, { status: 400 });
  }

  try {
    await cancelSubscription(row.abacateSubscriptionId);
  } catch (error) {
    log.error("subscription.cancel_failed", { userId, error });
    return Response.json({ error: "Failed to cancel." }, { status: 502 });
  }

  // Reflect locally immediately (a webhook will also confirm).
  await db
    .update(subscriptions)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId));

  log.info("subscription.canceled", { userId });
  return Response.json({ ok: true });
}

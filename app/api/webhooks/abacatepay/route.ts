import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import type { AbacateWebhook } from "@/lib/abacate";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // AbacatePay sends the shared secret as a query string parameter.
  const secret = new URL(req.url).searchParams.get("webhookSecret");
  if (!secret || secret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as AbacateWebhook;
  const { event, data } = body;

  // The userId we passed as externalId is echoed back; it may live in a few
  // places depending on the event payload.
  const userId =
    data?.externalId ??
    data?.subscription?.externalId ??
    data?.customer?.metadata?.externalId;

  if (!userId) {
    console.warn(`[abacate] webhook ${event} without externalId; ignoring.`);
    return Response.json({ ok: true });
  }

  // Defensive: ack (200) unknown users so AbacatePay doesn't retry forever.
  // FK to users would otherwise 500 and trigger endless redelivery.
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) {
    console.warn(
      `[abacate] webhook ${event} for unknown user ${userId}; ignoring.`,
    );
    return Response.json({ ok: true });
  }

  const abacateSubscriptionId = data?.subscription?.id ?? data?.id ?? null;
  const nextBilling =
    data?.nextBilling ?? data?.subscription?.nextBilling ?? null;
  const currentPeriodEnd = nextBilling ? new Date(nextBilling) : null;

  if (event === "subscription.completed" || event === "subscription.renewed") {
    await db
      .insert(subscriptions)
      .values({
        userId,
        abacateSubscriptionId,
        status: "active",
        currentPeriodEnd,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          abacateSubscriptionId,
          status: "active",
          currentPeriodEnd,
          updatedAt: new Date(),
        },
      });
  } else if (event === "subscription.cancelled") {
    await db
      .insert(subscriptions)
      .values({
        userId,
        abacateSubscriptionId,
        status: "canceled",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: { status: "canceled", updatedAt: new Date() },
      });
  } else {
    console.log(`[abacate] unhandled event ${event}`);
  }

  return Response.json({ ok: true });
}

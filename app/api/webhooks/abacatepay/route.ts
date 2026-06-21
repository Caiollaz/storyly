import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import type { AbacateWebhook } from "@/lib/abacate";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { log } from "@/lib/log";

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
    log.warn("abacate.webhook_no_external_id", { event });
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
    log.warn("abacate.webhook_unknown_user", { event, userId });
    return Response.json({ ok: true });
  }

  const abacateSubscriptionId = data?.subscription?.id ?? data?.id ?? null;
  const nextBilling =
    data?.nextBilling ?? data?.subscription?.nextBilling ?? null;
  const currentPeriodEnd = nextBilling ? new Date(nextBilling) : null;

  // A non-paid status on any subscription event means the plan lapsed
  // (expired / refunded / cancelled) — downgrade regardless of event name.
  const lapsed = ["EXPIRED", "CANCELLED", "REFUNDED"].includes(
    (data?.status ?? "").toUpperCase(),
  );

  if (
    !lapsed &&
    (event === "subscription.completed" || event === "subscription.renewed")
  ) {
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
  } else if (event === "subscription.cancelled" || lapsed) {
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
    log.info("abacate.webhook_unhandled", { event });
  }

  log.info("abacate.webhook", { event, userId, lapsed });
  return Response.json({ ok: true });
}

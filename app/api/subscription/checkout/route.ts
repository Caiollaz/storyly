import { auth } from "@/auth";
import { createSubscriptionCheckout } from "@/lib/abacate";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const productId = process.env.ABACATEPAY_PRO_PRODUCT_ID;
  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  if (!productId) {
    console.error("ABACATEPAY_PRO_PRODUCT_ID is not configured.");
    return Response.json(
      { error: "Server is not configured." },
      { status: 500 },
    );
  }

  try {
    const { url } = await createSubscriptionCheckout({
      productId,
      externalId: userId,
      completionUrl: `${appUrl}/account?status=success`,
      returnUrl: `${appUrl}/account`,
    });
    return Response.json({ url });
  } catch (error) {
    console.error("Error creating AbacatePay subscription:", error);
    return Response.json(
      { error: "Failed to start checkout." },
      { status: 502 },
    );
  }
}

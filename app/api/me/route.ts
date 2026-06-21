import { auth } from "@/auth";
import { getEntitlements } from "@/lib/entitlements";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const entitlements = await getEntitlements(userId);
  return Response.json(entitlements);
}

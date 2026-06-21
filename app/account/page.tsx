import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AccountPanel from "@/components/account-panel";
import { getEntitlements, reconcileSubscription } from "@/lib/entitlements";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Recover from any missed webhook before reading the plan.
  await reconcileSubscription(session.user.id);
  const entitlements = await getEntitlements(session.user.id);
  return (
    <AccountPanel
      entitlements={entitlements}
      price={process.env.PRO_PRICE_LABEL}
    />
  );
}

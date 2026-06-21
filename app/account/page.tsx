import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AccountPanel from "@/components/account-panel";
import { getEntitlements } from "@/lib/entitlements";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const entitlements = await getEntitlements(session.user.id);
  return <AccountPanel entitlements={entitlements} />;
}

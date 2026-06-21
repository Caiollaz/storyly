import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Game from "@/components/game";
import { getEntitlements } from "@/lib/entitlements";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const entitlements = await getEntitlements(session.user.id);

  return <Game initialEntitlements={entitlements} />;
}

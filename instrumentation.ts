// Runs once at server startup. Applies pending DB migrations so a fresh deploy
// never serves against missing tables. Idempotent (Drizzle tracks applied
// migrations); a failure is logged but doesn't block boot.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.DATABASE_URL) return;

  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const { db } = await import("@/lib/db");

  try {
    await migrate(db, { migrationsFolder: "lib/db/migrations" });
    console.log("[db] migrations applied");
  } catch (error) {
    console.error("[db] migration failed:", error);
  }
}

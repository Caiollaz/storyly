import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: required by drizzle-kit; checked at runtime in lib/db/index.ts
    url: process.env.DATABASE_URL!,
  },
});

import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI doesn't auto-load .env.local (Next.js does).
// Load .env.local first, then fall back to .env.
loadEnv({ path: path.resolve(".env.local"), override: false });
loadEnv({ override: false });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    // Direct (non-pooled) URL required for schema operations (db push, migrate).
    // Falls back to DATABASE_URL if DIRECT_URL is not set.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  migrate: {
    async adapter() {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const connectionString =
        process.env.DIRECT_URL ?? process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL (or DIRECT_URL) must be set to run migrations.");
      }
      return new PrismaPg({ connectionString });
    },
  },
});

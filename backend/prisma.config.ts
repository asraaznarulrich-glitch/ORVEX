import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // The empty fallback allows client generation in CI without production secrets.
    // Migration commands require DATABASE_URL to be set in the environment.
    url: process.env.DATABASE_URL ?? "",
  },
});

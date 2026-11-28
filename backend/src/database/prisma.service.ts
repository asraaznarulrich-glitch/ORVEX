import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import type { Prisma } from "../generated/prisma/client.js";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private client: PrismaClient | undefined;

  async onModuleInit(): Promise<void> {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("DATABASE_URL is required in production.");
      }
      this.logger.warn("DATABASE_URL is not set; database connection is disabled in this environment.");
      return;
    }

    const adapter = new PrismaPg({ connectionString });
    this.client = new PrismaClient({ adapter });
    await this.client.$connect();
    this.logger.log("PostgreSQL connection established.");
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.$disconnect();
      this.logger.log("PostgreSQL connection closed.");
    }
  }

  /**
   * Runs user-scoped work with RLS active. Role and claims are transaction-local,
   * so a pooled connection cannot retain a previous request's identity.
   */
  async withUserContext<T>(
    userId: string,
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      throw new Error("A valid authenticated user UUID is required for database access.");
    }

    return this.db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE authenticated");
      const claims = JSON.stringify({ sub: userId, role: "authenticated" });
      await tx.$queryRaw`SELECT
        set_config('request.jwt.claim.sub', ${userId}, true),
        set_config('request.jwt.claims', ${claims}, true)
      `;
      return callback(tx);
    });
  }

  get db(): PrismaClient {
    if (!this.client) {
      throw new Error("Database is not connected. Configure DATABASE_URL before using database services.");
    }
    return this.client;
  }
}

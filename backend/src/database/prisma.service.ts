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

  get db(): PrismaClient {
    if (!this.client) {
      throw new Error("Database is not connected. Configure DATABASE_URL before using database services.");
    }
    return this.client;
  }
}

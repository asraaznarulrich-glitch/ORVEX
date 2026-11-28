import { Controller, Get, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./database/prisma.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { Public } from "./auth/public.decorator.js";
import { OrganizationsModule } from "./organizations/organizations.module.js";

const moduleCatalog = [
  { id: "customers", name: "Clients & prospects", category: "business", status: "planned" },
  { id: "payments", name: "Paiements & rappels", category: "business", status: "planned" },
  { id: "learning", name: "Formations & certificats", category: "learning", status: "planned" },
  { id: "content", name: "Studio de contenu", category: "creation", status: "planned" },
  { id: "ai", name: "Assistants IA", category: "intelligence", status: "planned" },
  { id: "workspaces", name: "Espaces de travail", category: "collaboration", status: "planned" },
];

@Public()
@Controller("health")
class HealthController {
  @Get()
  check() {
    return { status: "ok", service: "orvex-api", timestamp: new Date().toISOString() };
  }
}

@Public()
@Controller("modules")
class ModulesController {
  @Get()
  list() {
    return { items: moduleCatalog, total: moduleCatalog.length };
  }
}

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    OrganizationsModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  controllers: [HealthController, ModulesController],
})
export class AppModule {}

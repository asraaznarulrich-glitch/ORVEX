import { Controller, Get, Module } from "@nestjs/common";
import { PrismaModule } from "./database/prisma.module.js";

const moduleCatalog = [
  { id: "customers", name: "Clients & prospects", category: "business", status: "planned" },
  { id: "payments", name: "Paiements & rappels", category: "business", status: "planned" },
  { id: "learning", name: "Formations & certificats", category: "learning", status: "planned" },
  { id: "content", name: "Studio de contenu", category: "creation", status: "planned" },
  { id: "ai", name: "Assistants IA", category: "intelligence", status: "planned" },
  { id: "workspaces", name: "Espaces de travail", category: "collaboration", status: "planned" },
];

@Controller("health")
class HealthController {
  @Get()
  check() {
    return { status: "ok", service: "orvex-api", timestamp: new Date().toISOString() };
  }
}

@Controller("modules")
class ModulesController {
  @Get()
  list() {
    return { items: moduleCatalog, total: moduleCatalog.length };
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, ModulesController],
})
export class AppModule {}

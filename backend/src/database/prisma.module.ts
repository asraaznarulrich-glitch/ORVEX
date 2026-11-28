import { Global, Module } from "@nestjs/common";
import { OrganizationAccessService } from "../organizations/organization-access.service.js";
import { PrismaService } from "./prisma.service.js";

@Global()
@Module({
  providers: [PrismaService, OrganizationAccessService],
  exports: [PrismaService, OrganizationAccessService],
})
export class PrismaModule {}

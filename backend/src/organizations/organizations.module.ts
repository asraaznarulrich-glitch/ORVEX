import { Module } from "@nestjs/common";
import { OrganizationsController } from "./organizations.controller.js";
import { OrganizationAccessGuard } from "./organization-access.guard.js";

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationAccessGuard],
})
export class OrganizationsModule {}

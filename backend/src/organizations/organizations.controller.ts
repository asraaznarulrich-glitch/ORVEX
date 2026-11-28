import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthenticatedUser } from "../auth/authenticated-user.js";
import { OrganizationAccessService } from "./organization-access.service.js";
import { OrganizationAccessGuard } from "./organization-access.guard.js";
import { OrganizationRoles } from "./organization-roles.decorator.js";

@Controller("organizations")
@UseGuards(OrganizationAccessGuard)
export class OrganizationsController {
  constructor(private readonly access: OrganizationAccessService) {}

  @Get(":organizationId/access")
  @OrganizationRoles("OWNER", "ADMIN", "MEMBER")
  async getMyAccess(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const membership = await this.access.requireMembership(user.id, organizationId);
    return {
      organizationId: membership.organizationId,
      membershipId: membership.id,
      role: membership.role,
    };
  }
}

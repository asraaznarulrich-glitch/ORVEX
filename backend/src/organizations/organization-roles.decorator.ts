import { SetMetadata } from "@nestjs/common";
import type { OrganizationRole } from "./organization-access.service.js";

export const ORGANIZATION_ROLES_KEY = "orvex:organizationRoles";
export const OrganizationRoles = (...roles: OrganizationRole[]) =>
  SetMetadata(ORGANIZATION_ROLES_KEY, roles);

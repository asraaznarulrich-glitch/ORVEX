import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { OrganizationAccessService, type OrganizationRole } from "./organization-access.service.js";
import { ORGANIZATION_ROLES_KEY } from "./organization-roles.decorator.js";

interface OrganizationRequest {
  params: { organizationId?: string };
  user?: { id: string };
}

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: OrganizationAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OrganizationRequest>();
    const userId = request.user?.id;
    const organizationId = request.params.organizationId;

    if (!userId) {
      throw new UnauthorizedException("Authentication is required.");
    }
    if (!organizationId) {
      throw new ForbiddenException("An organization context is required.");
    }

    const roles = this.reflector.getAllAndOverride<OrganizationRole[]>(
      ORGANIZATION_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (roles?.length) {
      await this.access.requireRole(userId, organizationId, roles);
    } else {
      await this.access.requireMembership(userId, organizationId);
    }

    return true;
  }
}

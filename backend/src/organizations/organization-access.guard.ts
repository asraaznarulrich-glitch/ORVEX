import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { OrganizationAccessService, type OrganizationRole } from "./organization-access.service.js";
import { ORGANIZATION_ROLES_KEY } from "./organization-roles.decorator.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    if (!UUID_PATTERN.test(organizationId)) {
      throw new BadRequestException("A valid organization UUID is required.");
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

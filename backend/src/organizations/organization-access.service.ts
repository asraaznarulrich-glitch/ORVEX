import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";

export type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER";

@Injectable()
export class OrganizationAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException("You do not have access to this organization.");
    }

    return membership;
  }

  async requireRole(
    userId: string,
    organizationId: string,
    allowedRoles: readonly OrganizationRole[],
  ) {
    const membership = await this.requireMembership(userId, organizationId);

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException("Your organization role does not allow this action.");
    }

    return membership;
  }
}

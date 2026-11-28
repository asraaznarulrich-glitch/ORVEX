import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { OrganizationAccessService } from "../dist/organizations/organization-access.service.js";
import { PrismaService } from "../dist/database/prisma.service.js";

test("PostgreSQL enforces real organization membership lookups", async () => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL must be set for database integration tests");

  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const userId = randomUUID();
  const outsiderId = randomUUID();
  const organizationId = randomUUID();
  const suffix = randomUUID();
  const access = new OrganizationAccessService(prisma);

  try {
    await prisma.db.user.createMany({
      data: [
        {
          id: userId,
          email: `member-${suffix}@orvex.test`,
          emailNormalized: `member-${suffix}@orvex.test`,
          status: "ACTIVE",
        },
        {
          id: outsiderId,
          email: `outsider-${suffix}@orvex.test`,
          emailNormalized: `outsider-${suffix}@orvex.test`,
          status: "ACTIVE",
        },
      ],
    });

    await prisma.db.organization.create({
      data: {
        id: organizationId,
        name: "ORVEX Integration Test",
        slug: `orvex-test-${suffix}`,
      },
    });

    await prisma.db.membership.create({
      data: {
        userId,
        organizationId,
        role: "ADMIN",
      },
    });

    const member = await access.requireMembership(userId, organizationId);
    assert.equal(member.userId, userId);
    assert.equal(member.organizationId, organizationId);
    assert.equal(member.role, "ADMIN");

    await assert.rejects(
      access.requireMembership(outsiderId, organizationId),
      (error) => error?.getStatus?.() === 403,
      "a user without a membership must be denied",
    );

    await assert.rejects(
      access.requireRole(userId, organizationId, ["OWNER"]),
      (error) => error?.getStatus?.() === 403,
      "a member with ADMIN role must not pass an OWNER-only check",
    );
  } finally {
    await prisma.db.organization.deleteMany({ where: { id: organizationId } });
    await prisma.db.user.deleteMany({ where: { id: { in: [userId, outsiderId] } } });
    await prisma.onModuleDestroy();
  }
});

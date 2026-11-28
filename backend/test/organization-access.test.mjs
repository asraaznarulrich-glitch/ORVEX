import assert from "node:assert/strict";
import test from "node:test";
import { OrganizationAccessService } from "../dist/organizations/organization-access.service.js";

function createService(membership) {
  let query;
  const prisma = {
    get db() {
      return {
        membership: {
          findUnique: async (args) => {
            query = args;
            return membership;
          },
        },
      };
    },
  };
  return {
    service: new OrganizationAccessService(prisma),
    getQuery: () => query,
  };
}

test("organization membership lookup is scoped to both user and organization", async () => {
  const membership = {
    id: "membership-1",
    userId: "user-1",
    organizationId: "org-1",
    role: "MEMBER",
  };
  const { service, getQuery } = createService(membership);

  const result = await service.requireMembership("user-1", "org-1");

  assert.deepEqual(result, membership);
  assert.deepEqual(getQuery().where.userId_organizationId, {
    userId: "user-1",
    organizationId: "org-1",
  });
});

test("organization access is denied when the user has no membership", async () => {
  const { service } = createService(null);

  await assert.rejects(
    service.requireMembership("user-1", "org-2"),
    (error) => error.getStatus() === 403,
  );
});

test("organization role checks reject insufficient privileges", async () => {
  const { service } = createService({
    id: "membership-1",
    userId: "user-1",
    organizationId: "org-1",
    role: "MEMBER",
  });

  await assert.rejects(
    service.requireRole("user-1", "org-1", ["OWNER", "ADMIN"]),
    (error) => error.getStatus() === 403,
  );
});

test("organization role checks allow an authorized administrator", async () => {
  const membership = {
    id: "membership-1",
    userId: "user-1",
    organizationId: "org-1",
    role: "ADMIN",
  };
  const { service } = createService(membership);

  const result = await service.requireRole("user-1", "org-1", ["OWNER", "ADMIN"]);

  assert.equal(result.role, "ADMIN");
});

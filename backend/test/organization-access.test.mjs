import assert from "node:assert/strict";
import test from "node:test";
import { OrganizationAccessService } from "../dist/organizations/organization-access.service.js";

function createService(membership) {
  let query;
  const prisma = {
    withUserContext: async (userId, callback) => {
      assert.match(userId, /^[0-9a-f-]{36}$/i);
      return callback({
        membership: {
          findUnique: async (args) => {
            query = args;
            return membership;
          },
        },
      });
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
    userId: "11111111-1111-4111-8111-111111111111",
    organizationId: "22222222-2222-4222-8222-222222222222",
    role: "MEMBER",
  };
  const { service, getQuery } = createService(membership);

  const result = await service.requireMembership("11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222");

  assert.deepEqual(result, membership);
  assert.deepEqual(getQuery().where.userId_organizationId, {
    userId: "11111111-1111-4111-8111-111111111111",
    organizationId: "22222222-2222-4222-8222-222222222222",
  });
});

test("organization access is denied when the user has no membership", async () => {
  const { service } = createService(null);

  await assert.rejects(
    service.requireMembership("11111111-1111-4111-8111-111111111111", "33333333-3333-4333-8333-333333333333"),
    (error) => error.getStatus() === 403,
  );
});

test("organization role checks reject insufficient privileges", async () => {
  const { service } = createService({
    id: "membership-1",
    userId: "11111111-1111-4111-8111-111111111111",
    organizationId: "22222222-2222-4222-8222-222222222222",
    role: "MEMBER",
  });

  await assert.rejects(
    service.requireRole("11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222", ["OWNER", "ADMIN"]),
    (error) => error.getStatus() === 403,
  );
});

test("organization role checks allow an authorized administrator", async () => {
  const membership = {
    id: "membership-1",
    userId: "11111111-1111-4111-8111-111111111111",
    organizationId: "22222222-2222-4222-8222-222222222222",
    role: "ADMIN",
  };
  const { service } = createService(membership);

  const result = await service.requireRole("11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222", ["OWNER", "ADMIN"]);

  assert.equal(result.role, "ADMIN");
});

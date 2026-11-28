import assert from "node:assert/strict";
import test from "node:test";
import { OrganizationAccessGuard } from "../dist/organizations/organization-access.guard.js";

function makeContext({ userId = "user-1", organizationId = "org-1" } = {}) {
  const request = {
    user: userId ? { id: userId } : undefined,
    params: organizationId ? { organizationId } : {},
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  };
  return { context, request };
}

test("organization guard checks membership for the authenticated user and route tenant", async () => {
  const calls = [];
  const access = {
    requireMembership: async (...args) => { calls.push(["membership", ...args]); },
    requireRole: async (...args) => { calls.push(["role", ...args]); },
  };
  const reflector = { getAllAndOverride: () => undefined };
  const { context } = makeContext({ userId: "user-a", organizationId: "org-a" });
  const guard = new OrganizationAccessGuard(reflector, access);

  assert.equal(await guard.canActivate(context), true);
  assert.deepEqual(calls, [["membership", "user-a", "org-a"]]);
});

test("organization guard enforces declared roles", async () => {
  const calls = [];
  const access = {
    requireMembership: async (...args) => { calls.push(["membership", ...args]); },
    requireRole: async (...args) => { calls.push(["role", ...args]); },
  };
  const reflector = { getAllAndOverride: () => ["OWNER", "ADMIN"] };
  const { context } = makeContext();
  const guard = new OrganizationAccessGuard(reflector, access);

  assert.equal(await guard.canActivate(context), true);
  assert.deepEqual(calls, [["role", "user-1", "org-1", ["OWNER", "ADMIN"]]]);
});

test("organization guard rejects missing authenticated user", async () => {
  const guard = new OrganizationAccessGuard(
    { getAllAndOverride: () => undefined },
    { requireMembership: async () => {}, requireRole: async () => {} },
  );
  const { context } = makeContext({ userId: null });

  await assert.rejects(guard.canActivate(context), error => error.getStatus() === 401);
});

test("organization guard rejects missing organization context", async () => {
  const guard = new OrganizationAccessGuard(
    { getAllAndOverride: () => undefined },
    { requireMembership: async () => {}, requireRole: async () => {} },
  );
  const { context } = makeContext({ organizationId: null });

  await assert.rejects(guard.canActivate(context), error => error.getStatus() === 403);
});

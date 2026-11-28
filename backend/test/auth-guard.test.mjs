import assert from "node:assert/strict";
import test from "node:test";
import { SupabaseAuthGuard, extractBearerToken } from "../dist/auth/supabase-auth.guard.js";

function createContext({ authorization, isPublic = false } = {}) {
  const request = { headers: { authorization } };
  return {
    request,
    context: {
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => request }),
    },
    reflector: {
      getAllAndOverride: () => isPublic,
    },
  };
}

test("bearer token parser accepts a single well-formed bearer credential", () => {
  assert.equal(extractBearerToken("Bearer abc.def_123-signature"), "abc.def_123-signature");
  assert.equal(extractBearerToken("bearer header.payload.signature"), "header.payload.signature");
});

test("bearer token parser rejects missing, malformed and ambiguous credentials", () => {
  assert.equal(extractBearerToken(undefined), null);
  assert.equal(extractBearerToken("Basic abc"), null);
  assert.equal(extractBearerToken("Bearer token extra"), null);
  assert.equal(extractBearerToken("Bearer token"), null);
  assert.equal(extractBearerToken("Bearer header.payload."), null);
  assert.equal(extractBearerToken(`Bearer ${"a".repeat(8193)}.payload.signature`), null);
  assert.equal(extractBearerToken("Bearer "), null);
});

test("public endpoints bypass token verification", async () => {
  let verifyCalled = false;
  const { context, request } = createContext({ isPublic: true });
  const guard = new SupabaseAuthGuard(
    { getAllAndOverride: () => true },
    { verifyAccessToken: async () => { verifyCalled = true; } },
  );

  assert.equal(await guard.canActivate(context), true);
  assert.equal(verifyCalled, false);
  assert.equal(request.user, undefined);
});

test("protected endpoints reject missing bearer credentials", async () => {
  const { context } = createContext();
  const guard = new SupabaseAuthGuard(
    { getAllAndOverride: () => false },
    { verifyAccessToken: async () => ({ id: "00000000-0000-4000-8000-000000000001", role: "authenticated" }) },
  );

  await assert.rejects(
    guard.canActivate(context),
    (error) => error.getStatus() === 401,
  );
});

test("protected endpoints attach only the verified user context", async () => {
  const expected = {
    id: "00000000-0000-4000-8000-000000000001",
    email: "member@example.test",
    role: "authenticated",
  };
  const { context, request } = createContext({ authorization: "Bearer signed.jwt.token" });
  const guard = new SupabaseAuthGuard(
    { getAllAndOverride: () => false },
    { verifyAccessToken: async (token) => {
      assert.equal(token, "signed.jwt.token");
      return expected;
    } },
  );

  assert.equal(await guard.canActivate(context), true);
  assert.deepEqual(request.user, expected);
});

import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { SupabaseJwtService } from "../dist/auth/supabase-jwt.service.js";

test("Supabase JWT verification validates signature, issuer, audience, expiry and identity claims", async () => {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const jwk = await exportJWK(publicKey);
  const jwks = { keys: [{ ...jwk, kid: "orvex-test-key", alg: "ES256", use: "sig" }] };
  const server = createServer((request, response) => {
    if (request.url !== "/auth/v1/.well-known/jwks.json") {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": "application/json", "cache-control": "public, max-age=60" });
    response.end(JSON.stringify(jwks));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = "http://127.0.0.1:" + address.port;
  const issuer = origin + "/auth/v1";
  const previousUrl = process.env.SUPABASE_URL;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.SUPABASE_URL = origin;
  process.env.NODE_ENV = "test";

  const service = new SupabaseJwtService();
  service.onModuleInit();

  const sign = async ({
    tokenIssuer = issuer,
    audience = "authenticated",
    subject = "00000000-0000-4000-8000-000000000001",
    role = "authenticated",
    issuedAt = Math.floor(Date.now() / 1000),
    expiresAt = Math.floor(Date.now() / 1000) + 300,
  } = {}) => new SignJWT({ role })
    .setProtectedHeader({ alg: "ES256", kid: "orvex-test-key" })
    .setIssuer(tokenIssuer)
    .setAudience(audience)
    .setSubject(subject)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(privateKey);

  try {
    const validToken = await sign();
    const user = await service.verifyAccessToken(validToken);
    assert.equal(user.id, "00000000-0000-4000-8000-000000000001");
    assert.equal(user.role, "authenticated");

    const wrongIssuer = await sign({ tokenIssuer: "https://attacker.example/auth/v1" });
    await assert.rejects(service.verifyAccessToken(wrongIssuer), error => error.getStatus() === 401);

    const wrongAudience = await sign({ audience: "anon" });
    await assert.rejects(service.verifyAccessToken(wrongAudience), error => error.getStatus() === 401);

    const expired = await sign({
      issuedAt: Math.floor(Date.now() / 1000) - 120,
      expiresAt: Math.floor(Date.now() / 1000) - 60,
    });
    await assert.rejects(service.verifyAccessToken(expired), error => error.getStatus() === 401);

    const futureIssuedAt = await sign({ issuedAt: Math.floor(Date.now() / 1000) + 120 });
    await assert.rejects(service.verifyAccessToken(futureIssuedAt), error => error.getStatus() === 401);

    const wrongRole = await sign({ role: "service_role" });
    await assert.rejects(service.verifyAccessToken(wrongRole), error => error.getStatus() === 401);

    const invalidSubject = await sign({ subject: "not-a-uuid" });
    await assert.rejects(service.verifyAccessToken(invalidSubject), error => error.getStatus() === 401);

    const missingIssuedAt = await new SignJWT({ role: "authenticated" })
      .setProtectedHeader({ alg: "ES256", kid: "orvex-test-key" })
      .setIssuer(issuer)
      .setAudience("authenticated")
      .setSubject("00000000-0000-4000-8000-000000000001")
      .setExpirationTime(Math.floor(Date.now() / 1000) + 300)
      .sign(privateKey);
    await assert.rejects(service.verifyAccessToken(missingIssuedAt), error => error.getStatus() === 401);
  } finally {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

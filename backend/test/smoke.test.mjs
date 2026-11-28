import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

const apiDirectory = new URL("../", import.meta.url);
const entrypoint = new URL("../dist/main.js", import.meta.url);

async function getFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function waitForHttp(url, child) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`API exited before becoming ready (code ${child.exitCode}).`);
    }
    try {
      const response = await fetch(url);
      return response;
    } catch {
      await delay(100);
    }
  }
  child.kill("SIGTERM");
  throw new Error("API did not become ready within 5 seconds.");
}

test("API starts and exposes health and module catalogue endpoints", async () => {
  const port = await getFreePort();
  const child = spawn(process.execPath, [entrypoint.pathname], {
    cwd: apiDirectory,
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(port),
      CORS_ORIGINS: "http://localhost:3000",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });

  try {
    const healthResponse = await waitForHttp(`http://127.0.0.1:${port}/api/v1/health`, child);
    assert.equal(healthResponse.status, 200);
    const health = await healthResponse.json();
    assert.equal(health.status, "ok");
    assert.equal(health.service, "orvex-api");

    const modulesResponse = await fetch(`http://127.0.0.1:${port}/api/v1/modules`);
    assert.equal(modulesResponse.status, 200);
    const modules = await modulesResponse.json();
    assert.equal(modules.total, 6);
    assert.equal(modules.items.length, 6);
    assert.ok(modules.items.every((item) => item.status === "planned"));

    const protectedResponse = await fetch(
      `http://127.0.0.1:${port}/api/v1/organizations/00000000-0000-4000-8000-000000000001/access`,
    );
    assert.equal(protectedResponse.status, 401);

    // A short burst from this test client must hit the configured per-IP ceiling.
    const burstResponses = await Promise.all(
      Array.from({ length: 110 }, () => fetch(`http://127.0.0.1:${port}/api/v1/health`)),
    );
    assert.ok(
      burstResponses.some((response) => response.status === 429),
      "Expected the API to reject requests after the per-IP rate limit is reached.",
    );
    assert.ok(burstResponses.every((response) => [200, 429].includes(response.status)));
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : String(error)}\n${stderr}`);
  } finally {
    child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      delay(2000),
    ]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
});

test("API refuses production startup without trusted CORS origins", async () => {
  const child = spawn(process.execPath, [entrypoint.pathname], {
    cwd: apiDirectory,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: "3001",
      CORS_ORIGINS: "",
    },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });

  const exitCode = await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(5000).then(() => null),
  ]);
  if (exitCode === null) {
    child.kill("SIGKILL");
    assert.fail("API did not reject the invalid production configuration.");
  }
  assert.equal(exitCode, 1);
  assert.match(stderr, /CORS_ORIGINS must contain at least one trusted frontend origin/);
});


test("API refuses malformed CORS origins in production", async () => {
  const child = spawn(process.execPath, [entrypoint.pathname], {
    cwd: apiDirectory,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: "3001",
      CORS_ORIGINS: "https://orvex.example.com/dashboard",
    },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });

  const exitCode = await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(5000).then(() => null),
  ]);
  if (exitCode === null) {
    child.kill("SIGKILL");
    assert.fail("API did not reject the malformed CORS origin.");
  }
  assert.equal(exitCode, 1);
  assert.match(stderr, /Invalid CORS origin/);
});

test("API refuses an invalid port", async () => {
  const child = spawn(process.execPath, [entrypoint.pathname], {
    cwd: apiDirectory,
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: "70000",
      CORS_ORIGINS: "http://localhost:3000",
    },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });

  const exitCode = await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(5000).then(() => null),
  ]);
  if (exitCode === null) {
    child.kill("SIGKILL");
    assert.fail("API did not reject the invalid port.");
  }
  assert.equal(exitCode, 1);
  assert.match(stderr, /PORT must be a valid integer between 1 and 65535/);
});

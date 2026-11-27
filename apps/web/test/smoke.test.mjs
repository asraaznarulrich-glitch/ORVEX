import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

const webDirectory = new URL("../", import.meta.url);

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

test("production frontend serves the ORVEX workspace", async () => {
  const port = await getFreePort();
  const child = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: webDirectory,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });

  try {
    let response;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (child.exitCode !== null) {
        throw new Error(`Frontend exited before becoming ready (code ${child.exitCode}).\n${stderr}`);
      }
      try {
        response = await fetch(`http://127.0.0.1:${port}/`);
        break;
      } catch {
        await delay(250);
      }
    }
    assert.ok(response, "Frontend did not become ready within 15 seconds.");
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /ORVEX/);
    assert.match(html, /Bonjour et bienvenue/);
    assert.match(html, /MODE DÉMO/);
  } finally {
    child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      delay(2000),
    ]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
});

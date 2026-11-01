import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";

const env = {
  ALLOWED_ORIGIN: "https://teamzyvorax.github.io",
  DB: {
    prepare(sql) {
      return {
        bind() {
          return {
            async first() { return null; },
            async run() { return { success: true }; }
          };
        }
      };
    }
  }
};

test("health endpoint reports the API is running", async () => {
  const response = await worker.fetch(new Request("https://api.example/health", {
    headers: { Origin: env.ALLOWED_ORIGIN }
  }), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), env.ALLOWED_ORIGIN);
  assert.deepEqual(await response.json(), { ok: true, service: "zyvora-domains-api" });
});

test("preflight allows the configured frontend origin", async () => {
  const response = await worker.fetch(new Request("https://api.example/api/requests", {
    method: "OPTIONS",
    headers: { Origin: env.ALLOWED_ORIGIN }
  }), env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-methods"), "GET,POST,OPTIONS");
});

test("name check rejects invalid and reserved names", async () => {
  for (const name of ["ab", "-bad", "bad-", "www", "a name"]) {
    const response = await worker.fetch(new Request(
      "https://api.example/api/check?name=" + encodeURIComponent(name)
    ), env);
    assert.equal(response.status, 400, name);
  }
});

test("name check returns database availability for a valid name", async () => {
  const response = await worker.fetch(new Request("https://api.example/api/check?name=my-project"), env);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.name, "my-project");
  assert.equal(body.available, true);
});

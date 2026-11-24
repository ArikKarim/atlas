import test from "node:test";
import assert from "node:assert/strict";
import { createSecureServer } from "../secure-server.mjs";

async function fixture(options = {}, run) {
  const server = createSecureServer({ password: "test-password", ...options });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const root = "http://127.0.0.1:" + server.address().port;
  const login = async (password = "test-password", extra = {}) => {
    const page = await fetch(root + (options.basePath || "") + "/"),
      html = await page.text(),
      csrf = html.match(/name="csrf" value="([^"]+)"/)?.[1],
      cookie = page.headers.get("set-cookie")?.split(";")[0];
    const body =
      extra.body ||
      new URLSearchParams({
        password,
        returnTo: (options.basePath || "") + "/#trends",
      });
    body.set("csrf", csrf || "");
    return fetch(root + (options.basePath || "") + "/auth/login", {
      ...extra,
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie || "",
        ...extra.headers,
      },
      body,
    });
  };
  try {
    await run({ root, login });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("secure server denies every app asset and data route before authentication", async () =>
  fixture({}, async ({ root, login }) => {
    const page = await fetch(root + "/");
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Password/);
    assert.ok(!html.includes("app.js"));
    assert.ok(!html.includes("835113638d2a"));
    assert.ok(!html.includes("H.R.633"));
    for (const route of [
      "/bills.json",
      "/congress-data.json",
      "/app.js",
      "/charts.js",
      "/chart-export.js",
      "/companions.js",
      "/style.css",
      "/access.js",
      "/api/session",
      "/auth-session.js",
      "/bills.json?unlock=true",
    ]) {
      const r = await fetch(root + route);
      assert.equal(r.status, 401, route);
      assert.match(r.headers.get("cache-control"), /no-store/);
      assert.equal(await r.text(), "Password required.");
    }
    const wrong = await login("incorrect");
    assert.equal(wrong.status, 401);
    assert.ok(!wrong.headers.get("set-cookie").includes("atlas_session="));
    const forged = await fetch(root + "/bills.json", {
      headers: {
        Cookie: "atlas_session=fake",
        Authorization: "Bearer unlocked",
        "x-agc-user-email": "test@example.com",
      },
    });
    assert.equal(forged.status, 401);
  }));

test("valid signed sessions unlock data, reject tampering, expire and revoke on logout", async () => {
  let time = Date.now();
  await fixture(
    { now: () => time, sessionSeconds: 60 },
    async ({ root, login }) => {
      const success = await login();
      assert.equal(success.status, 303);
      assert.equal(success.headers.get("location"), "/#trends");
      const setCookie = success.headers.get("set-cookie");
      assert.match(setCookie, /HttpOnly/);
      assert.match(setCookie, /SameSite=Strict/);
      const cookie = setCookie.split(";")[0],
        headers = { Cookie: cookie };
      assert.equal(
        (await fetch(root + "/bills.json", { headers })).status,
        200,
      );
      const app = await (await fetch(root + "/", { headers })).text();
      assert.match(app, /src="\.\/app\.js"/);
      assert.ok(!app.includes("password-gate"));
      assert.ok(!app.includes("./access.js"));
      assert.match(app, /<script nonce=/);
      assert.equal((await fetch(root + "/access.js", { headers })).status, 404);
      assert.equal(
        (
          await fetch(root + "/bills.json", {
            headers: {
              Cookie: cookie.slice(0, -1) + (cookie.endsWith("x") ? "y" : "x"),
            },
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await fetch(root + "/auth/logout", {
            method: "POST",
            headers,
            redirect: "manual",
          })
        ).status,
        303,
      );
      assert.equal(
        (await fetch(root + "/bills.json", { headers })).status,
        401,
      );
      const next = (await login()).headers.get("set-cookie").split(";")[0];
      time += 61000;
      assert.equal(
        (await fetch(root + "/bills.json", { headers: { Cookie: next } }))
          .status,
        401,
      );
    },
  );
});

test("proxy deployment supports /atlas, Secure cookies, origin checks and safe return paths", async () =>
  fixture(
    { basePath: "/atlas", publicOrigin: "https://arikkarim.com" },
    async ({ root, login }) => {
      assert.equal((await fetch(root + "/bills.json")).status, 404);
      const rejected = await login("test-password", {
        headers: {
          Origin: "https://untrusted.example",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      assert.equal(rejected.status, 403);
      const opaque = await login("test-password", {
        headers: { Origin: "null", "Sec-Fetch-Site": "same-origin" },
      });
      assert.equal(opaque.status, 303);
      const crossSite = await login("test-password", {
        headers: { Origin: "null", "Sec-Fetch-Site": "cross-site" },
      });
      assert.equal(crossSite.status, 403);
      const missingToken = await fetch(root + "/atlas/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ password: "test-password" }),
      });
      assert.equal(missingToken.status, 403);
      const success = await login();
      assert.match(
        success.headers.get("set-cookie"),
        /Path=\/atlas\/; HttpOnly; SameSite=Strict; Secure/,
      );
      assert.equal(success.headers.get("location"), "/atlas/#trends");
      const cookie = success.headers.get("set-cookie").split(";")[0];
      assert.equal(
        (
          await fetch(root + "/atlas/congress-data.json", {
            headers: { Cookie: cookie },
          })
        ).status,
        200,
      );
      const redirect = await login("test-password", {
        body: new URLSearchParams({
          password: "test-password",
          returnTo: "//untrusted.example",
        }),
      });
      assert.equal(redirect.headers.get("location"), "/atlas/");
    },
  ));

test("missing password fails closed and repeated guesses are throttled", async () => {
  await fixture({ password: "" }, async ({ root }) => {
    for (const route of ["/", "/bills.json", "/app.js"])
      assert.equal((await fetch(root + route)).status, 503);
  });
  await fixture({ maxFailures: 2 }, async ({ login }) => {
    assert.equal((await login("wrong")).status, 401);
    assert.equal((await login("wrong")).status, 401);
    const throttled = await login("wrong");
    assert.equal(throttled.status, 429);
    assert.ok(Number(throttled.headers.get("retry-after")) > 0);
  });
});

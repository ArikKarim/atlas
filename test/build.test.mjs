import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { build } from "../scripts/build.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

test("all browser modules parse before publication", async () => {
  const directory = fileURLToPath(new URL("../public/", import.meta.url));
  for (const file of (await readdir(directory)).filter((name) =>
    name.endsWith(".js"),
  )) {
    await promisify(execFile)(process.execPath, [
      "--check",
      path.join(directory, file),
    ]);
  }
});

test("production asset versions cover the whole module graph and leave bill data unchanged", async () => {
  const target = await mkdtemp(path.join(tmpdir(), "atlas-build-"));
  try {
    const result = await build({ target });
    for (const name of await readdir(target)) {
      if (!/\.(js|html)$/.test(name)) continue;
      const text = await readFile(path.join(target, name), "utf8");
      for (const match of text.matchAll(
        /['"]\.\/([^'"?]+\.(?:js|css))\?v=([^'"]+)['"]/g,
      )) {
        assert.equal(match[2], result.version, name);
        assert.ok(
          (await readdir(target)).includes(match[1]),
          name + ": " + match[1],
        );
      }
      assert.ok(!/['"]\.\/[^'"?]+\.(?:js|css)['"]/.test(text), name);
    }
    assert.equal(
      await readFile(path.join(target, "bills.json"), "utf8"),
      await readFile(new URL("../public/bills.json", import.meta.url), "utf8"),
    );
    const again = await build({ target });
    assert.equal(again.version, result.version);
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

test("changing a dependency invalidates entry points and nested module imports together", async () => {
  const temp = await mkdtemp(path.join(tmpdir(), "atlas-build-change-"));
  const source = path.join(temp, "source"),
    target = path.join(temp, "output");
  const { mkdir } = await import("node:fs/promises");
  try {
    await mkdir(source);
    await writeFile(
      path.join(source, "index.html"),
      '<script type="module" src="./app.js"></script>',
    );
    await writeFile(path.join(source, "app.js"), "import './dependency.js';");
    await writeFile(
      path.join(source, "dependency.js"),
      "export const value=1;",
    );
    const first = await build({ source, target });
    await writeFile(
      path.join(source, "dependency.js"),
      "export const value=2;",
    );
    const second = await build({ source, target });
    assert.notEqual(first.version, second.version);
    assert.ok(
      (await readFile(path.join(target, "index.html"), "utf8")).includes(
        second.version,
      ),
    );
    assert.ok(
      (await readFile(path.join(target, "app.js"), "utf8")).includes(
        second.version,
      ),
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

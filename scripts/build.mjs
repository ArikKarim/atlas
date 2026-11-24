import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

export async function build({
  source = new URL("../public/", import.meta.url),
  target = new URL("../dist/", import.meta.url),
} = {}) {
  const input = source instanceof URL ? fileURLToPath(source) : source;
  const output = target instanceof URL ? fileURLToPath(target) : target;
  const names = (await readdir(input)).sort();
  const assets = [];
  const hash = createHash("sha256");
  for (const name of names.filter((name) => /\.(js|css|html)$/.test(name))) {
    const text = await readFile(path.join(input, name), "utf8");
    assets.push({ name, text });
    hash.update(name).update("\0").update(text);
  }
  const version = hash.digest("hex").slice(0, 12);
  await mkdir(output, { recursive: true });
  await cp(input, output, { recursive: true });
  for (const { name, text } of assets) {
    const versioned = text.replace(
      /(['"])(\.\/[^'"?]+\.(?:js|css))(?:\?v=[^'"]*)?\1/g,
      (_, quote, asset) => `${quote}${asset}?v=${version}${quote}`,
    );
    await writeFile(path.join(output, name), versioned);
  }
  return { directory: output, version };
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  console.log(await build());

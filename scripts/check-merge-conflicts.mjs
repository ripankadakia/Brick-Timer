import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const skipDirs = new Set([".git", "node_modules", "dist", ".vite", ".cache"]);
const conflictPattern = /^(<<<<<<<|=======|>>>>>>>) /m;
const filesWithConflicts = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) {
        return;
      }
      await walk(fullPath);
      return;
    }

    if (!entry.isFile()) {
      return;
    }

    const relativePath = path.relative(root, fullPath);
    const content = await readFile(fullPath, "utf8");
    if (conflictPattern.test(content)) {
      filesWithConflicts.push(relativePath);
    }
  }));
}

await walk(root);

if (filesWithConflicts.length > 0) {
  console.error("Merge conflict markers found in:");
  for (const file of filesWithConflicts) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("No merge conflict markers detected.");

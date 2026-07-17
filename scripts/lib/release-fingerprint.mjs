import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function runGit(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hashFile(filePath) {
  return fs.existsSync(filePath) ? hash(fs.readFileSync(filePath)) : null;
}

export function resolveCommitIdentity(env, gitHead) {
  const candidates = [
    ["VERCEL_GIT_COMMIT_SHA", env.VERCEL_GIT_COMMIT_SHA],
    ["GITHUB_SHA", env.GITHUB_SHA],
    ...(env.CI ? [["GIT_SHA", env.GIT_SHA]] : []),
    ["git-head", gitHead],
  ];
  const [source, value] = candidates.find(([, candidate]) => candidate?.trim()) ?? [
    "unavailable",
    null,
  ];
  return { commitSha: value?.trim() || null, source };
}

export function buildReleaseFingerprint(root, env = process.env) {
  const gitHead = runGit(root, ["rev-parse", "HEAD"]) || null;
  const branch = runGit(root, ["branch", "--show-current"]) || null;
  const dirtyEntries = runGit(root, ["status", "--porcelain=v1", "--untracked-files=all"])
    .split("\n")
    .filter(Boolean);
  const migrationsDir = path.join(root, "supabase", "migrations");
  const migrationFiles = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).sort()
    : [];
  const migrationPayload = migrationFiles
    .map((name) => `${name}\0${fs.readFileSync(path.join(migrationsDir, name))}`)
    .join("\0");
  const identity = resolveCommitIdentity(env, gitHead);

  return {
    ...identity,
    gitHead,
    branch,
    dirtyTree: {
      isDirty: dirtyEntries.length > 0,
      entryCount: dirtyEntries.length,
      fingerprint: hash(dirtyEntries.join("\n")),
      entries: dirtyEntries,
    },
    lockfile: {
      path: "package-lock.json",
      sha256: hashFile(path.join(root, "package-lock.json")),
    },
    migrations: {
      count: migrationFiles.length,
      latestId: migrationFiles.at(-1)?.replace(/\.sql$/, "") ?? null,
      sha256: hash(migrationPayload),
    },
  };
}

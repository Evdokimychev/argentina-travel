import packageJson from "../../../package.json";

/** Short git commit SHA injected at build/deploy (CI, Vercel, Docker). */
export function getGitSha(): string | null {
  const sha =
    process.env.GIT_SHA?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.trim();
  return sha || null;
}

export function getAppVersion(): string {
  return process.env.APP_VERSION?.trim() || packageJson.version;
}

export function getShortGitSha(sha: string): string {
  return sha.length > 7 ? sha.slice(0, 7) : sha;
}

import { describe, expect, it } from "vitest";
import { resolveCommitIdentity } from "../../scripts/lib/release-fingerprint.mjs";

describe("release fingerprint commit identity", () => {
  it("ignores a stale local GIT_SHA and uses the checked-out HEAD", () => {
    expect(resolveCommitIdentity({ GIT_SHA: "stale" }, "current-head")).toEqual({
      commitSha: "current-head",
      source: "git-head",
    });
  });

  it("uses the GitHub event SHA in CI", () => {
    expect(
      resolveCommitIdentity(
        { CI: "true", GITHUB_SHA: "github-sha", GIT_SHA: "fallback-sha" },
        "checkout-head",
      ),
    ).toEqual({ commitSha: "github-sha", source: "GITHUB_SHA" });
  });

  it("uses the Vercel commit SHA for a deployment build", () => {
    expect(
      resolveCommitIdentity(
        { VERCEL_GIT_COMMIT_SHA: "vercel-sha", GITHUB_SHA: "github-sha" },
        "checkout-head",
      ),
    ).toEqual({ commitSha: "vercel-sha", source: "VERCEL_GIT_COMMIT_SHA" });
  });
});

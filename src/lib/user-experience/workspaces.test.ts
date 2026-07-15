import { describe, expect, it } from "vitest";
import { availableWorkspaces, resolveActiveWorkspace } from "./workspaces";

describe("active workspace", () => {
  it("maps server roles to available workspaces", () => {
    expect(availableWorkspaces(["tourist"])).toEqual(["travel"]);
    expect(availableWorkspaces(["tourist", "organizer"])).toEqual(["travel", "organizer"]);
    expect(availableWorkspaces(["tourist", "organizer", "admin"])).toEqual([
      "travel",
      "organizer",
      "admin",
    ]);
  });

  it("rejects an unavailable cookie preference", () => {
    expect(resolveActiveWorkspace(["tourist"], "admin")).toBe("travel");
    expect(resolveActiveWorkspace(["organizer"], "organizer")).toBe("organizer");
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  CatalogRestCircuitOpenError,
  createCatalogRestCircuit,
  shouldLogCatalogRestError,
} from "@/lib/catalog-rest-circuit";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("catalog REST circuit", () => {
  it("runs one quota probe and suppresses concurrent operations without sharing data", async () => {
    const first = deferred<string>();
    const onOpen = vi.fn();
    const circuit = createCatalogRestCircuit({ onOpen });
    const firstOperation = vi.fn(() => first.promise);
    const secondOperation = vi.fn(async () => "private-second-result");

    const firstCall = circuit.run(firstOperation);
    const secondCall = circuit.run(secondOperation);
    first.reject(new Error("402 exceed_egress_quota"));

    await expect(firstCall).rejects.toThrow("exceed_egress_quota");
    await expect(secondCall).rejects.toBeInstanceOf(CatalogRestCircuitOpenError);
    expect(firstOperation).toHaveBeenCalledTimes(1);
    expect(secondOperation).not.toHaveBeenCalled();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("lets waiting operations execute separately after a successful probe", async () => {
    const first = deferred<{ accessToken: string; value: string }>();
    const circuit = createCatalogRestCircuit();
    const secondOperation = vi.fn(async () => ({
      accessToken: "token-b",
      value: "second-private-result",
    }));

    const firstCall = circuit.run(() => first.promise);
    const secondCall = circuit.run(secondOperation);
    first.resolve({ accessToken: "token-a", value: "first-private-result" });

    await expect(firstCall).resolves.toEqual({
      accessToken: "token-a",
      value: "first-private-result",
    });
    await expect(secondCall).resolves.toEqual({
      accessToken: "token-b",
      value: "second-private-result",
    });
    expect(secondOperation).toHaveBeenCalledTimes(1);
  });

  it("opens when a follower fails with quota after a successful cold probe", async () => {
    const first = deferred<string>();
    const follower = deferred<string>();
    const circuit = createCatalogRestCircuit();

    const firstCall = circuit.run(() => first.promise);
    const followerCall = circuit.run(() => follower.promise);
    first.resolve("healthy-first-result");
    await expect(firstCall).resolves.toBe("healthy-first-result");
    follower.reject(new Error("402 exceed_egress_quota"));
    await expect(followerCall).rejects.toThrow("exceed_egress_quota");

    const blockedOperation = vi.fn(async () => "must-not-run");
    await expect(circuit.run(blockedOperation)).rejects.toBeInstanceOf(
      CatalogRestCircuitOpenError,
    );
    expect(blockedOperation).not.toHaveBeenCalled();
  });

  it("skips operations during cooldown and allows exactly one half-open probe", async () => {
    let time = 1_000;
    const circuit = createCatalogRestCircuit({ cooldownMs: 50, now: () => time });
    await expect(circuit.run(async () => {
      throw new Error("quota exceeded");
    })).rejects.toThrow("quota exceeded");

    const blocked = vi.fn(async () => "blocked");
    await expect(circuit.run(blocked)).rejects.toBeInstanceOf(CatalogRestCircuitOpenError);
    expect(blocked).not.toHaveBeenCalled();

    time += 50;
    const probe = deferred<string>();
    const firstRecovery = circuit.run(() => probe.promise);
    const followerOperation = vi.fn(async () => "follower");
    const followerRecovery = circuit.run(followerOperation);
    probe.resolve("probe");

    await expect(firstRecovery).resolves.toBe("probe");
    await expect(followerRecovery).rejects.toBeInstanceOf(CatalogRestCircuitOpenError);
    expect(followerOperation).not.toHaveBeenCalled();
    await expect(circuit.run(followerOperation)).resolves.toBe("follower");
    expect(followerOperation).toHaveBeenCalledTimes(1);
  });

  it("does not open for non-quota failures", async () => {
    const circuit = createCatalogRestCircuit();
    await expect(circuit.run(async () => {
      throw new Error("malformed payload");
    })).rejects.toThrow("malformed payload");

    await expect(circuit.run(async () => "recovered")).resolves.toBe("recovered");
  });

  it("suppresses only synthetic circuit-open log amplification", () => {
    expect(shouldLogCatalogRestError(new CatalogRestCircuitOpenError())).toBe(false);
    expect(
      shouldLogCatalogRestError(
        new Error("tripster_detail_unavailable:quota: catalog_rest_circuit_open:quota"),
      ),
    ).toBe(false);
    expect(shouldLogCatalogRestError(new Error("402 exceed_egress_quota"))).toBe(true);
    expect(shouldLogCatalogRestError(new Error("permission denied for relation tours"))).toBe(true);
  });
});

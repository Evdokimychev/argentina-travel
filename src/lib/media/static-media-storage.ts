import { Client } from "basic-ftp";
import { Readable } from "node:stream";
import {
  buildCmsStoragePublicUrl,
  buildReviewPhotoPublicUrl,
} from "@/lib/media/media-cdn";

export type MediaStorageBackend = "supabase" | "reg-ru-ftp";

export type StaticMediaUploadResult =
  | { ok: true; publicUrl: string; remotePath: string }
  | { error: string };

export function getMediaStorageBackend(): MediaStorageBackend {
  const backend = process.env.MEDIA_STORAGE_BACKEND?.trim();
  return backend === "reg-ru-ftp" ? "reg-ru-ftp" : "supabase";
}

export function isRegRuFtpStorageEnabled(): boolean {
  return getMediaStorageBackend() === "reg-ru-ftp";
}

function getFtpRemoteRoot(): string {
  const root = process.env.MEDIA_FTP_REMOTE_ROOT?.trim();
  if (!root) {
    throw new Error("MEDIA_FTP_REMOTE_ROOT is required for reg-ru-ftp storage");
  }
  return root.replace(/\/+$/, "");
}

function getRequiredFtpEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for reg-ru-ftp storage`);
  }
  return value;
}

async function withFtpClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client(20_000);
  client.ftp.verbose = process.env.MEDIA_FTP_VERBOSE === "1";

  try {
    await client.access({
      host: getRequiredFtpEnv("MEDIA_FTP_HOST"),
      port: Number(process.env.MEDIA_FTP_PORT ?? "21"),
      user: getRequiredFtpEnv("MEDIA_FTP_USER"),
      password: getRequiredFtpEnv("MEDIA_FTP_PASSWORD"),
      secure: process.env.MEDIA_FTP_SECURE === "true",
    });
    return await fn(client);
  } finally {
    client.close();
  }
}

function joinRemotePath(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .join("/");
}

async function ensureRemoteDir(client: Client, remoteDir: string): Promise<void> {
  const segments = remoteDir.split("/").filter(Boolean);
  let current = remoteDir.startsWith("/") ? "" : "";

  for (const segment of segments) {
    current = current ? `${current}/${segment}` : `/${segment}`;
    try {
      await client.send(`MKD ${current}`);
    } catch {
      // Directory likely exists — ignore.
    }
  }
}

export async function uploadCmsMediaToStaticStorage(
  buffer: Buffer,
  storagePath: string
): Promise<StaticMediaUploadResult> {
  try {
    const remotePath = joinRemotePath(getFtpRemoteRoot(), storagePath);
    const remoteDir = remotePath.slice(0, remotePath.lastIndexOf("/"));

    await withFtpClient(async (client) => {
      await ensureRemoteDir(client, remoteDir);
      const stream = Readable.from(buffer);
      await client.uploadFrom(stream, remotePath);
    });

    return {
      ok: true,
      publicUrl: buildCmsStoragePublicUrl(storagePath),
      remotePath,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "FTP upload failed",
    };
  }
}

export async function uploadReviewPhotoToStaticStorage(
  buffer: Buffer,
  storagePath: string
): Promise<StaticMediaUploadResult> {
  try {
    const remotePath = joinRemotePath(getFtpRemoteRoot(), "reviews", storagePath);
    const remoteDir = remotePath.slice(0, remotePath.lastIndexOf("/"));

    await withFtpClient(async (client) => {
      await ensureRemoteDir(client, remoteDir);
      const stream = Readable.from(buffer);
      await client.uploadFrom(stream, remotePath);
    });

    return {
      ok: true,
      publicUrl: buildReviewPhotoPublicUrl(storagePath),
      remotePath,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "FTP upload failed",
    };
  }
}

export async function deleteFromStaticStorage(
  storagePath: string,
  scope: "cms" | "review"
): Promise<{ ok: true } | { error: string }> {
  try {
    const remotePath =
      scope === "review"
        ? joinRemotePath(getFtpRemoteRoot(), "reviews", storagePath)
        : joinRemotePath(getFtpRemoteRoot(), storagePath);

    await withFtpClient(async (client) => {
      await client.remove(remotePath);
    });

    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "FTP delete failed",
    };
  }
}

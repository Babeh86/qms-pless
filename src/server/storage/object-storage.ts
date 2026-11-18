import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Attachment object storage.
 *
 * Drivers:
 *  - `s3`: any S3-compatible service, configured from environment variables.
 *  - `local`: development only, files under `.uploads/`. Production refuses to
 *    start without S3 so binaries are never silently kept on an ephemeral disk.
 *
 * Everything fails closed: callers must not record attachment metadata unless the
 * binary was durably written.
 */

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
const LOCAL_ROOT = path.join(process.cwd(), ".uploads");

/** Extension allowlist; content type is verified separately at the API boundary. */
export const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  ".dwg",
  ".dxf",
  ".dwt",
  ".dws",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".tif",
  ".tiff",
  ".pdf",
  ".step",
  ".stp",
  ".iges",
  ".igs",
  ".stl",
  ".svg",
]);

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Object storage belum dikonfigurasi");
    this.name = "StorageNotConfiguredError";
  }
}

export type StorageDriver = "s3" | "local";

export interface StorageConfig {
  driver: StorageDriver;
  endpoint?: string;
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
}

function readConfig(): StorageConfig {
  const forced = process.env.STORAGE_DRIVER;

  const {
    S3_ENDPOINT,
    S3_REGION,
    S3_BUCKET,
    S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY,
    S3_FORCE_PATH_STYLE,
  } = process.env;

  const hasS3 = Boolean(
    S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY,
  );

  if (forced === "local" || (!hasS3 && process.env.NODE_ENV !== "production")) {
    return { driver: "local" };
  }

  if (forced === "s3" && !hasS3) throw new StorageNotConfiguredError();
  if (!hasS3) throw new StorageNotConfiguredError();

  return {
    driver: "s3",
    endpoint: S3_ENDPOINT,
    region: S3_REGION || "us-east-1",
    bucket: S3_BUCKET,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    forcePathStyle: S3_FORCE_PATH_STYLE !== "false",
  };
}

let cached: { config: StorageConfig; s3: S3Client | null } | null = null;

function getStorage(): { config: StorageConfig; s3: S3Client | null } {
  if (cached) return cached;
  const config = readConfig();

  const s3 =
    config.driver === "s3"
      ? new S3Client({
          endpoint: config.endpoint,
          region: config.region,
          forcePathStyle: config.forcePathStyle,
          credentials: {
            accessKeyId: config.accessKeyId as string,
            secretAccessKey: config.secretAccessKey as string,
          },
        })
      : null;

  cached = { config, s3 };
  return cached;
}

/** For tests/tools that change environment variables at runtime. */
export function resetStorageForTests(): void {
  cached = null;
}

export function currentDriver(): StorageDriver {
  return getStorage().config.driver;
}

export function assertStorageConfigured(): void {
  getStorage();
}

export function extensionOf(name: string): string {
  const index = name.lastIndexOf(".");
  return index < 0 ? "" : name.slice(index).toLowerCase();
}

export interface PutAttachmentInput {
  checksheetId: string;
  userId: string;
  fileName: string;
  contentType: string;
  bytes: Buffer;
}

export interface StoredAttachment {
  objectKey: string;
  checksumSha256: string;
  sizeBytes: number;
}

/**
 * Object keys are generated server-side (never derived from client input) and are
 * validated again before any local filesystem access.
 */
function isValidObjectKey(key: string): boolean {
  return /^checksheets\/[A-Za-z0-9_-]+\/[A-Za-z0-9-]+\.[a-z0-9]+$/.test(key);
}

function localPathFor(objectKey: string): string {
  if (!isValidObjectKey(objectKey)) throw new Error("Object key tidak valid");
  const resolved = path.resolve(LOCAL_ROOT, objectKey);
  const root = path.resolve(LOCAL_ROOT) + path.sep;
  if (!resolved.startsWith(root)) throw new Error("Object key di luar direktori storage");
  return resolved;
}

export async function putAttachment(input: PutAttachmentInput): Promise<StoredAttachment> {
  const { config, s3 } = getStorage();

  if (input.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Ukuran lampiran melebihi batas 30 MB");
  }

  const checksumSha256 = createHash("sha256").update(input.bytes).digest("hex");
  const objectKey = `checksheets/${input.checksheetId}/${randomUUID()}${extensionOf(input.fileName)}`;

  if (config.driver === "local") {
    const target = localPathFor(objectKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.bytes, { flag: "wx" });
    return { objectKey, checksumSha256, sizeBytes: input.bytes.byteLength };
  }

  await (s3 as S3Client).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: input.bytes,
      ContentType: input.contentType,
      ChecksumSHA256: Buffer.from(checksumSha256, "hex").toString("base64"),
      Metadata: { uploadedBy: input.userId, originalName: encodeURIComponent(input.fileName) },
    }),
  );

  return { objectKey, checksumSha256, sizeBytes: input.bytes.byteLength };
}

/** S3 signed URL, or null when the local driver must be served by an API route. */
export async function getSignedAttachmentUrl(
  objectKey: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  const { config, s3 } = getStorage();
  if (config.driver === "local") return null;

  return getSignedUrl(
    s3 as S3Client,
    new GetObjectCommand({ Bucket: config.bucket, Key: objectKey }),
    { expiresIn: expiresInSeconds },
  );
}

export async function readLocalAttachment(objectKey: string): Promise<Buffer> {
  const { config } = getStorage();
  if (config.driver !== "local") throw new Error("Driver storage bukan lokal");
  return readFile(localPathFor(objectKey));
}

export async function deleteAttachment(objectKey: string): Promise<void> {
  const { config, s3 } = getStorage();

  if (config.driver === "local") {
    await unlink(localPathFor(objectKey)).catch(() => undefined);
    return;
  }

  await (s3 as S3Client).send(
    new DeleteObjectCommand({ Bucket: config.bucket, Key: objectKey }),
  );
}

export const ATTACHMENT_MAX_BYTES = MAX_UPLOAD_BYTES;

import { createHash, randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Object storage adapter (S3-compatible).
 *
 * Configuration comes from environment variables only. When unconfigured the
 * adapter fails closed: callers must not delete/mark attachments persisted if
 * the binary was never durably stored.
 */

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;

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

export interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

function readConfig(): StorageConfig | null {
  const {
    S3_ENDPOINT,
    S3_REGION,
    S3_BUCKET,
    S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY,
    S3_FORCE_PATH_STYLE,
  } = process.env;

  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) return null;

  return {
    endpoint: S3_ENDPOINT,
    region: S3_REGION || "us-east-1",
    bucket: S3_BUCKET,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    forcePathStyle: S3_FORCE_PATH_STYLE !== "false",
  };
}

let client: { config: StorageConfig; s3: S3Client } | null = null;

function getClient(): { config: StorageConfig; s3: S3Client } {
  if (client) return client;
  const config = readConfig();
  if (!config) throw new StorageNotConfiguredError();
  client = {
    config,
    s3: new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
  };
  return client;
}

export function assertStorageConfigured(): void {
  getClient();
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

export async function putAttachment(input: PutAttachmentInput): Promise<StoredAttachment> {
  const { config, s3 } = getClient();

  if (input.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Ukuran lampiran melebihi batas 30 MB");
  }

  const checksumSha256 = createHash("sha256").update(input.bytes).digest("hex");
  const objectKey = `checksheets/${input.checksheetId}/${randomUUID()}${extensionOf(input.fileName)}`;

  await s3.send(
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

export async function getAttachmentUrl(objectKey: string, expiresInSeconds = 300): Promise<string> {
  const { config, s3 } = getClient();
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: config.bucket, Key: objectKey }), {
    expiresIn: expiresInSeconds,
  });
}

export async function deleteAttachment(objectKey: string): Promise<void> {
  const { config, s3 } = getClient();
  await s3.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: objectKey }));
}

export const ATTACHMENT_MAX_BYTES = MAX_UPLOAD_BYTES;

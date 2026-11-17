import { AppError } from "@/server/authz/guard";
import {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  ATTACHMENT_MAX_BYTES,
  extensionOf,
} from "@/server/storage/object-storage";

const ALLOWED_CONTENT_PREFIXES = ["image/", "application/pdf", "application/octet-stream"];

/**
 * Upload policy for check sheet attachments. Kept pure so it can be unit-tested
 * without object storage or a database.
 */
export function assertUploadAllowed(fileName: string, contentType: string, sizeBytes: number): void {
  const extension = extensionOf(fileName);
  if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
    throw new AppError("VALIDATION", `Format file ${extension || "(tanpa ekstensi)"} tidak didukung`, 422);
  }
  if (!ALLOWED_CONTENT_PREFIXES.some((prefix) => contentType.startsWith(prefix))) {
    throw new AppError("VALIDATION", "Content-Type lampiran tidak didukung", 422);
  }
  if (sizeBytes <= 0) throw new AppError("VALIDATION", "File kosong tidak dapat diunggah", 422);
  if (sizeBytes > ATTACHMENT_MAX_BYTES) {
    throw new AppError("VALIDATION", "Ukuran lampiran melebihi batas 30 MB", 422);
  }
}

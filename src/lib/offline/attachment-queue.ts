"use client";

/**
 * Offline attachment queue.
 *
 * Files are kept in IndexedDB (localStorage cannot hold blobs). Each entry is tied
 * to the draft's idempotency key so it can be uploaded to the real document as soon
 * as that draft has synced.
 */

const DB_NAME = "qms-offline";
const DB_VERSION = 1;
const STORE = "attachments";

export interface QueuedAttachment {
  id: string;
  draftKey: string;
  fileName: string;
  contentType: string;
  blob: Blob;
  createdAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("draftKey", "draftKey", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      }),
  );
}

export async function queueAttachment(
  draftKey: string,
  file: File,
): Promise<QueuedAttachment> {
  const entry: QueuedAttachment = {
    id: `${draftKey}-${crypto.randomUUID()}`,
    draftKey,
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    blob: file,
    createdAt: new Date().toISOString(),
  };

  if (typeof indexedDB === "undefined") throw new Error("Penyimpanan offline tidak tersedia");
  await tx("readwrite", (store) => store.add(entry));
  return entry;
}

export async function listQueuedAttachments(draftKey: string): Promise<QueuedAttachment[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const rows = await tx<QueuedAttachment[]>("readonly", (store) =>
      store.index("draftKey").getAll(draftKey) as IDBRequest<QueuedAttachment[]>,
    );
    return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export async function removeQueuedAttachment(id: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await tx("readwrite", (store) => store.delete(id));
}

export async function countQueuedAttachments(draftKey: string): Promise<number> {
  return (await listQueuedAttachments(draftKey)).length;
}

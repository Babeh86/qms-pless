"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FileImage, FileText, ImagePlus, Trash2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { useOfflineSync } from "@/components/offline/offline-sync-provider";
import { queueAttachment } from "@/lib/offline/attachment-queue";

const ACCEPTED = ".dwg,.dxf,.dwt,.dws,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff,.pdf,.step,.stp,.iges,.igs,.stl,.svg,.ai,.eps";
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(ACCEPTED.split(","));

type Attachment = { id: string; file: File; previewUrl?: string; source: "file" | "camera" };

export function ChecksheetAttachments({
  checksheetId,
  draftKey,
  onBeforeUpload,
}: {
  checksheetId?: string | null;
  /** Idempotency key of the local draft, used to queue files while offline. */
  draftKey?: string;
  /** Persists the draft first so the attachment is linked to a real document. */
  onBeforeUpload?: () => Promise<string | null>;
} = {}) {
  const { online } = useOfflineSync();
  const [uploadState, setUploadState] = useState<Record<string, "pending" | "uploading" | "stored" | "failed">>({});
  const t = useTranslations("form");
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const filesRef = useRef<Attachment[]>([]);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    filesRef.current.forEach((attachment) => {
      if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    });
  }, []);

  function addFiles(selected: FileList | File[]) {
    setError(null);
    const accepted: Attachment[] = [];
    for (const file of Array.from(selected)) {
      const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
      if (!ALLOWED_EXTENSIONS.has(extension)) {
        setError(t("unsupportedAttachment", { name: file.name }));
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(t("attachmentTooLarge", { name: file.name }));
        continue;
      }
      const previewUrl = file.type.startsWith("image/") || file.type === "application/pdf"
        ? URL.createObjectURL(file)
        : undefined;
      accepted.push({ id: crypto.randomUUID(), file, previewUrl, source: "file" });
    }
    if (accepted.length) {
      setFiles((current) => [...current, ...accepted]);
      void uploadAll(accepted);
    }
  }

  async function uploadAll(attachments: Attachment[]) {
    if (!online && draftKey) {
      for (const attachment of attachments) {
        try {
          await queueAttachment(draftKey, attachment.file);
          setUploadState((current) => ({ ...current, [attachment.id]: "pending" }));
        } catch {
          setUploadState((current) => ({ ...current, [attachment.id]: "failed" }));
          setError(t("attachmentUploadFailed", { name: attachment.file.name }));
        }
      }
      return;
    }

    let targetId = checksheetId ?? null;
    if (!targetId && onBeforeUpload) targetId = await onBeforeUpload();
    if (!targetId) {
      setError(t("attachmentNeedsDraft"));
      setUploadState((current) => ({
        ...current,
        ...Object.fromEntries(attachments.map((attachment) => [attachment.id, "failed" as const])),
      }));
      return;
    }

    for (const attachment of attachments) {
      setUploadState((current) => ({ ...current, [attachment.id]: "uploading" }));
      const data = new FormData();
      data.append("file", attachment.file, attachment.file.name);
      try {
        const response = await fetch(`/api/checksheets/${targetId}/attachments`, {
          method: "POST",
          body: data,
        });
        if (!response.ok) {
          setUploadState((current) => ({ ...current, [attachment.id]: "failed" }));
          setError(
            response.status === 503
              ? t("attachmentStorageUnavailable")
              : t("attachmentUploadFailed", { name: attachment.file.name }),
          );
          continue;
        }
        setUploadState((current) => ({ ...current, [attachment.id]: "stored" }));
      } catch {
        setUploadState((current) => ({ ...current, [attachment.id]: "failed" }));
        setError(t("attachmentUploadFailed", { name: attachment.file.name }));
      }
    }
  }

  async function openCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      cameraInputRef.current?.click();
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `checksheet-photo-${new Date().toISOString().replaceAll(":", "-")}.jpg`, { type: "image/jpeg" });
      addFiles([file]);
      closeCamera();
    }, "image/jpeg", 0.92);
  }

  function uploadLabel(state?: "pending" | "uploading" | "stored" | "failed") {
    if (state === "stored") return t("attachmentStored");
    if (state === "uploading") return t("attachmentUploading");
    if (state === "failed") return t("attachmentFailed");
    return t("attachmentPending");
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const removed = current.find((attachment) => attachment.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((attachment) => attachment.id !== id);
    });
  }

  return (
    <Card className="border-slate-200/80">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><FileImage className="h-4 w-4"/></span>
            <div><h2 className="text-[13px] font-bold text-slate-800">{t("attachmentsTitle")}</h2><p className="mt-0.5 max-w-2xl text-[10px] leading-relaxed text-slate-500">{t("attachmentsDescription")}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <input ref={inputRef} type="file" multiple accept={ACCEPTED} className="sr-only" aria-label={t("chooseAttachments")} onChange={(event) => { if (event.currentTarget.files) addFiles(event.currentTarget.files); event.currentTarget.value = ""; }}/>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="sr-only" aria-label={t("openCamera")} onChange={(event) => { if (event.currentTarget.files) addFiles(event.currentTarget.files); event.currentTarget.value = ""; }}/>
            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"><Upload className="h-3.5 w-3.5"/>{t("chooseFile")}</button>
            <button type="button" onClick={openCamera} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-700 px-3 text-[10px] font-semibold text-white transition hover:bg-blue-800"><Camera className="h-3.5 w-3.5"/>{t("openCamera")}</button>
          </div>
        </div>

        <label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }} className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-3 py-3 text-center transition hover:border-blue-300 hover:bg-blue-50/50">
          <ImagePlus className="h-4 w-4 text-blue-600"/><span className="text-[10px] font-medium text-slate-700">{t("dropAttachments")}</span><span className="text-[9px] text-slate-400">{t("acceptedAttachmentFormats")}</span>
          <input type="file" multiple accept={ACCEPTED} className="sr-only" onChange={(event) => { if (event.currentTarget.files) addFiles(event.currentTarget.files); event.currentTarget.value = ""; }}/>
        </label>

        {error ? <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-[10px] font-medium text-rose-700">{error}</p> : null}

        {files.length ? <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{files.map((attachment) => <li key={attachment.id} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white p-2"><span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 text-slate-500">{attachment.previewUrl && attachment.file.type.startsWith("image/") ? <span role="img" aria-label={attachment.file.name} className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${attachment.previewUrl})` }}/> : attachment.file.type === "application/pdf" ? <FileText className="h-4 w-4 text-rose-600"/> : attachment.file.type.startsWith("image/") ? <FileImage className="h-4 w-4 text-blue-600"/> : <FileText className="h-4 w-4"/>}</span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-slate-700" title={attachment.file.name}>{attachment.file.name}</span><span className="block text-[9px] text-slate-400">{(attachment.file.size / (1024 * 1024)).toFixed(2)} {t("megabyteUnit")} · {uploadLabel(uploadState[attachment.id])} · {attachment.source === "camera" ? t("cameraPhoto") : attachment.file.type || t("technicalFile")}</span></span><button type="button" onClick={() => removeFile(attachment.id)} aria-label={t("removeAttachment", { name: attachment.file.name })} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5"/></button></li>)}</ul> : null}
      </CardContent>

      {cameraOpen ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4" role="presentation" onClick={closeCamera}><section role="dialog" aria-modal="true" aria-labelledby="camera-title" className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><h2 id="camera-title" className="text-sm font-bold text-slate-800">{t("cameraTitle")}</h2><p className="mt-0.5 text-[10px] text-slate-500">{t("cameraHint")}</p></div><button type="button" onClick={closeCamera} aria-label={t("closeCamera")} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4"/></button></div><div className="bg-black"><video ref={videoRef} autoPlay playsInline className="max-h-[65vh] w-full object-contain"/></div><div className="flex justify-end gap-2 p-3"><button type="button" onClick={closeCamera} className="h-9 rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-700">{t("cancelCamera")}</button><button type="button" onClick={capturePhoto} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-700 px-4 text-xs font-semibold text-white hover:bg-blue-800"><Camera className="h-4 w-4"/>{t("capturePhoto")}</button></div></section></div> : null}
    </Card>
  );
}

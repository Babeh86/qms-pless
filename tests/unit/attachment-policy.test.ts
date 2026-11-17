import { describe, expect, it } from "vitest";
import { assertUploadAllowed } from "@/server/checksheet/attachment-policy";

describe("attachment upload policy", () => {
  it.each([
    ["drawing.dwg", "application/octet-stream", 1024],
    ["drawing.dxf", "application/octet-stream", 1024],
    ["part.jpg", "image/jpeg", 2048],
    ["part.png", "image/png", 2048],
    ["spec.pdf", "application/pdf", 4096],
  ])("accepts supported file %s", (name, type, size) => {
    expect(() => assertUploadAllowed(name, type, size)).not.toThrow();
  });

  it("rejects an unsupported extension", () => {
    expect(() => assertUploadAllowed("malware.exe", "application/octet-stream", 10)).toThrow(
      /tidak didukung/,
    );
  });

  it("rejects a file without an extension", () => {
    expect(() => assertUploadAllowed("readme", "application/pdf", 10)).toThrow(/tidak didukung/);
  });

  it("rejects a content type that is not image/PDF/octet-stream", () => {
    expect(() => assertUploadAllowed("part.png", "text/html", 10)).toThrow(/Content-Type/);
  });

  it("rejects empty files", () => {
    expect(() => assertUploadAllowed("part.png", "image/png", 0)).toThrow(/kosong/);
  });

  it("rejects files above the 30 MB limit", () => {
    expect(() => assertUploadAllowed("part.pdf", "application/pdf", 30 * 1024 * 1024 + 1)).toThrow(
      /30 MB/,
    );
  });

  it("accepts exactly 30 MB", () => {
    expect(() =>
      assertUploadAllowed("part.pdf", "application/pdf", 30 * 1024 * 1024),
    ).not.toThrow();
  });
});

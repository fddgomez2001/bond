import {
  MAX_SOURCE_FILE_BYTES,
  MAX_UPLOAD_FILE_BYTES,
  MIME_EXTENSIONS,
  formatBytes,
  type AllowedMimeType,
} from "@/lib/config/uploads";

/**
 * Browser-only. Checks a picked file and, for images, re-encodes it as a
 * resized JPEG. Re-encoding keeps uploads small (Vercel's 4.5 MB request
 * limit) and drops EXIF metadata such as GPS location from phone photos.
 */
export async function prepareFile(
  file: File,
  accept: readonly AllowedMimeType[],
): Promise<{ file: File } | { error: string }> {
  const type = file.type as AllowedMimeType;
  if (!accept.includes(type)) {
    const allowed = accept.map((t) => MIME_EXTENSIONS[t].toUpperCase()).join(", ");
    return { error: `Choose a ${allowed} file.` };
  }
  if (file.size > MAX_SOURCE_FILE_BYTES) {
    return { error: `That file is too large. Choose one smaller than ${formatBytes(MAX_SOURCE_FILE_BYTES)}.` };
  }

  if (type === "application/pdf") {
    if (file.size > MAX_UPLOAD_FILE_BYTES) {
      return { error: `PDFs must be ${formatBytes(MAX_UPLOAD_FILE_BYTES)} or smaller.` };
    }
    return { file };
  }

  try {
    const compressed = await compressImage(file);
    if (compressed.size > MAX_UPLOAD_FILE_BYTES) {
      return { error: "That image is too detailed to upload. Try a smaller photo." };
    }
    return { file: compressed };
  } catch {
    return { error: "We couldn't read that image. Try a different JPG or PNG." };
  }
}

const ATTEMPTS = [
  { maxDimension: 1800, quality: 0.85 },
  { maxDimension: 1400, quality: 0.75 },
  { maxDimension: 1100, quality: 0.65 },
];

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    let blob: Blob | null = null;
    for (const { maxDimension, quality } of ATTEMPTS) {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      // JPEG has no transparency, so flatten onto white.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= MAX_UPLOAD_FILE_BYTES) break;
    }
    if (!blob) throw new Error("Encoding failed");
    const name = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

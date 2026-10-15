import "server-only";

import {
  MAX_UPLOAD_FILE_BYTES,
  MIME_EXTENSIONS,
  formatBytes,
  type AllowedMimeType,
} from "@/lib/config/uploads";

/** Detects the real file type from its first bytes instead of trusting the name or browser. */
function sniffMimeType(bytes: Uint8Array): AllowedMimeType | null {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, i) => bytes[offset + i] === byte);

  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }
  if (startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  return null;
}

export type ValidatedFile = {
  bytes: Uint8Array;
  mimeType: AllowedMimeType;
  extension: string;
  size: number;
};

export async function validateUpload(
  value: FormDataEntryValue | null,
  options: { label: string; accept: readonly AllowedMimeType[]; required: boolean },
): Promise<{ file: ValidatedFile | null; error?: string }> {
  if (!(value instanceof File) || value.size === 0) {
    return options.required
      ? { file: null, error: `${options.label} is required` }
      : { file: null };
  }

  if (value.size > MAX_UPLOAD_FILE_BYTES) {
    return {
      file: null,
      error: `${options.label} must be ${formatBytes(MAX_UPLOAD_FILE_BYTES)} or smaller`,
    };
  }

  const bytes = new Uint8Array(await value.arrayBuffer());
  const mimeType = sniffMimeType(bytes);

  if (!mimeType || !options.accept.includes(mimeType)) {
    const allowed = options.accept.map((type) => MIME_EXTENSIONS[type].toUpperCase()).join(", ");
    return { file: null, error: `${options.label} must be a ${allowed} file` };
  }

  return {
    file: { bytes, mimeType, extension: MIME_EXTENSIONS[mimeType], size: value.size },
  };
}

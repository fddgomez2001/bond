/**
 * Upload rules shared by the browser (early feedback) and the server
 * (enforcement). Vercel caps a function request body at 4.5 MB, so images
 * are resized in the browser before upload and the combined payload is
 * kept under MAX_TOTAL_UPLOAD_BYTES.
 */

export const PRIVATE_DOCUMENTS_BUCKET = "private-documents";

const MB = 1024 * 1024;

/** Largest file a user can pick, before browser-side image compression. */
export const MAX_SOURCE_FILE_BYTES = 10 * MB;
/** Largest single file the server accepts. */
export const MAX_UPLOAD_FILE_BYTES = 2 * MB;
/** Largest combined size of all files in one registration request. */
export const MAX_TOTAL_UPLOAD_BYTES = 4 * MB;

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DOCUMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, "application/pdf"] as const;

export type AllowedMimeType = (typeof DOCUMENT_MIME_TYPES)[number];

export const documentTypes = {
  selfie: {
    label: "Selfie",
    description: "A clear, front-facing photo of yourself. Images only.",
    accept: IMAGE_MIME_TYPES,
  },
  government_id: {
    label: "Valid Government ID",
    description: "A photo or PDF scan of a valid government-issued ID.",
    accept: DOCUMENT_MIME_TYPES,
  },
  proof_of_business: {
    label: "Proof of Business",
    description: "Business permit, registration certificate, or similar (image or PDF).",
    accept: DOCUMENT_MIME_TYPES,
  },
} as const;

export type DocumentType = keyof typeof documentTypes;

export const MIME_EXTENSIONS: Record<AllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(1).replace(/\.0$/, "")} MB`;
}

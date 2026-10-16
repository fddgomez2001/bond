"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImageUp, RefreshCw, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { IMAGE_MIME_TYPES, MAX_SOURCE_FILE_BYTES, formatBytes } from "@/lib/config/uploads";
import { prepareFile } from "@/lib/uploads/prepare-file";
import { cn } from "@/lib/utils";

/**
 * Photo chooser for shop logos and listing photos. Images are resized in
 * the browser (smaller uploads, no GPS metadata) before they're sent.
 */
export function ImagePicker({
  label,
  hint,
  currentUrl,
  file,
  onChange,
  error,
  disabled,
  shape = "wide",
}: {
  label: string;
  hint?: string;
  currentUrl: string | null;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  shape?: "wide" | "square";
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [localError, setLocalError] = useState<string>();
  // Object URL for the preview, tied to the file it was made from.
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const previewUrl = file && preview?.file === file ? preview.url : null;

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);

  async function handleFile(picked: File | undefined) {
    if (!picked) return;
    setLocalError(undefined);
    setProcessing(true);
    const result = await prepareFile(picked, IMAGE_MIME_TYPES);
    setProcessing(false);
    if ("error" in result) {
      setLocalError(result.error);
      return;
    }
    setPreview({ file: result.file, url: URL.createObjectURL(result.file) });
    onChange(result.file);
  }

  const shown = previewUrl ?? currentUrl;
  const shownError = localError ?? error;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold text-bond-ink">
        {label}
      </label>
      {hint && <p className="text-xs text-bond-ink/60">{hint}</p>}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_MIME_TYPES.join(",")}
        className="peer sr-only"
        disabled={disabled || processing}
        aria-invalid={Boolean(shownError) || undefined}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <div
        className={cn(
          "flex items-center gap-4 rounded-2xl border bg-bond-paper p-3 peer-focus-visible:ring-4 peer-focus-visible:ring-bond-yellow/60",
          shownError ? "border-red-300" : "border-bond-ink/10",
        )}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || processing}
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-bond-cream text-bond-slate transition-transform duration-300 ease-smooth hover:scale-[1.02]",
            shape === "square" ? "size-20" : "aspect-[4/3] w-28 sm:w-32",
          )}
          aria-label={shown ? `Change ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        >
          {processing ? (
            <Spinner />
          ) : shown ? (
            // Blob previews and already-optimised storage URLs; next/image adds nothing here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="size-full object-cover" />
          ) : (
            <ImageUp className="size-6" aria-hidden />
          )}
        </button>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium text-bond-ink">
            {file ? "New photo ready" : currentUrl ? "Current photo" : "No photo yet"}
          </p>
          <p className="text-xs text-bond-ink/55">
            JPG, PNG or WEBP · up to {formatBytes(MAX_SOURCE_FILE_BYTES)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || processing}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-bond-slate hover:bg-bond-slate/10 disabled:opacity-50"
            >
              <RefreshCw className="size-3.5" aria-hidden />
              {shown ? "Replace" : "Choose photo"}
            </button>
            {file && (
              <button
                type="button"
                onClick={() => {
                  setLocalError(undefined);
                  onChange(null);
                }}
                disabled={disabled || processing}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Undo
              </button>
            )}
          </div>
        </div>
      </div>
      {shownError && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {shownError}
        </p>
      )}
    </div>
  );
}

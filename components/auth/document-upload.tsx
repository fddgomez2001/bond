"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { CircleCheckBig, FileText, ImageUp, RefreshCw, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  MAX_SOURCE_FILE_BYTES,
  MIME_EXTENSIONS,
  documentTypes,
  formatBytes,
  type DocumentType,
} from "@/lib/config/uploads";
import { prepareFile } from "@/lib/uploads/prepare-file";
import { cn } from "@/lib/utils";

export function DocumentUpload({
  type,
  file,
  onChange,
  error,
  disabled,
  required = true,
}: {
  type: DocumentType;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const definition = documentTypes[type];
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  // Object URL for the image preview, tied to the file it was made from.
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const previewUrl = preview && preview.file === file ? preview.url : null;

  function replacePreview(next: File | null) {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(
      next && next.type.startsWith("image/") ? { file: next, url: URL.createObjectURL(next) } : null,
    );
  }

  async function handleFile(picked: File | undefined) {
    if (!picked) return;
    setLocalError(undefined);
    setProcessing(true);
    const result = await prepareFile(picked, definition.accept);
    setProcessing(false);
    if ("error" in result) {
      setLocalError(result.error);
      return;
    }
    replacePreview(result.file);
    onChange(result.file);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) void handleFile(event.dataTransfer.files?.[0]);
  }

  const shownError = localError ?? error;
  const acceptAttr = definition.accept.join(",");
  const formats = definition.accept.map((t) => MIME_EXTENSIONS[t].toUpperCase()).join(", ");
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-semibold text-bond-ink">
          {definition.label}
          {required && <span aria-hidden className="ml-0.5 text-red-600">*</span>}
        </label>
        {file && !processing && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <CircleCheckBig className="size-3.5" aria-hidden /> Ready
          </span>
        )}
      </div>
      <p className="text-xs text-bond-ink/60">{definition.description}</p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={acceptAttr}
        className="peer sr-only"
        disabled={disabled || processing}
        aria-invalid={Boolean(shownError) || undefined}
        aria-describedby={shownError ? errorId : undefined}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {file ? (
        <div
          className={cn(
            "flex items-center gap-4 rounded-2xl border bg-bond-paper p-3",
            shownError ? "border-red-300" : "border-bond-ink/10",
          )}
        >
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-bond-cream">
            {previewUrl ? (
              // A blob: URL from the user's own file, so next/image adds nothing here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={`${definition.label} preview`} className="size-full object-cover" />
            ) : (
              <FileText className="size-7 text-bond-slate" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-bond-ink">{file.name}</p>
            <p className="text-xs text-bond-ink/55">{formatBytes(file.size)}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || processing}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-bond-slate hover:bg-bond-slate/10 disabled:opacity-50"
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Replace
              <span className="sr-only"> {definition.label}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLocalError(undefined);
                replacePreview(null);
                onChange(null);
              }}
              disabled={disabled || processing}
              className="inline-flex items-center rounded-lg px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" aria-hidden />
              <span className="sr-only">Remove {definition.label}</span>
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            "peer-focus-visible:ring-4 peer-focus-visible:ring-bond-yellow/60",
            dragging
              ? "border-bond-slate bg-bond-yellow/20"
              : shownError
                ? "border-red-300 bg-red-50/40"
                : "border-bond-ink/15 bg-bond-paper hover:border-bond-slate/40 hover:bg-bond-cream/60",
            (disabled || processing) && "cursor-not-allowed opacity-70",
          )}
        >
          {processing ? (
            <>
              <Spinner className="text-bond-slate" />
              <p className="text-sm text-bond-ink/70">Preparing file…</p>
            </>
          ) : (
            <>
              <span className="flex size-11 items-center justify-center rounded-full bg-bond-yellow/50 text-bond-slate">
                <ImageUp className="size-5" aria-hidden />
              </span>
              <p className="text-sm text-bond-ink/80">
                <span className="font-semibold text-bond-slate">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-bond-ink/50">
                {formats} · up to {formatBytes(MAX_SOURCE_FILE_BYTES)}
              </p>
            </>
          )}
        </label>
      )}

      {shownError && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {shownError}
        </p>
      )}
    </div>
  );
}

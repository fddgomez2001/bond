import type { RegistrationResponse } from "@/types/auth";

/**
 * POSTs multipart form data with XMLHttpRequest so we can report upload
 * progress (fetch() has no upload progress events).
 */
export function postFormWithProgress(
  url: string,
  body: FormData,
  onProgress?: (percent: number) => void,
): Promise<RegistrationResponse> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      const response = xhr.response as RegistrationResponse | null;
      if (response && typeof response === "object" && "ok" in response) {
        resolve(response);
      } else if (xhr.status === 413) {
        resolve({ ok: false, message: "Your files are too large to upload. Try smaller images." });
      } else {
        resolve({ ok: false, message: "Something went wrong. Please try again." });
      }
    };

    xhr.onerror = () =>
      resolve({ ok: false, message: "Network error. Check your connection and try again." });

    xhr.send(body);
  });
}

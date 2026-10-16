import { supabaseUrl } from "@/lib/supabase/config";

export const PUBLIC_MEDIA_BUCKET = "public-media";

/** Public URL for a shop logo or listing photo stored in the public-media bucket. */
export function mediaUrl(path: string | null | undefined) {
  if (!path || !supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${PUBLIC_MEDIA_BUCKET}/${path}`;
}

import type { NextConfig } from "next";

// Shop logos and listing photos are served from Supabase Storage.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const storageImages = supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)] : [];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Listing photos are resized in the browser to ≤ 2 MB; leave room for form overhead.
      bodySizeLimit: "3mb",
    },
  },
  images: {
    // Smallest modern formats first; browsers that can't use AVIF get WebP.
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    remotePatterns: storageImages,
    // Statically imported images (logo, mascot) have content-hashed URLs and
    // are cached as immutable anyway; this covers any other image.
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Browsers only honour this over HTTPS, so it's harmless on localhost.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

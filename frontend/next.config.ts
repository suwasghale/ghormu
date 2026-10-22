import type { NextConfig } from "next";

import { mapTileOrigins } from "./config/map";

const nextConfig: NextConfig = {
  output: "standalone",

  reactStrictMode: true,

  poweredByHeader: false,

  compress: true,

  experimental: {
    // Two root layouts (public site and account screens) leave no single
    // layout for a 404; app/global-not-found.tsx renders one instead.
    globalNotFound: true,
  },

  images: {
    remotePatterns: process.env.MEDIA_HOST ? [{ protocol: 'https', hostname: process.env.MEDIA_HOST }] : [],
    formats: ['image/avif', 'image/webp'],
    // 85 for full-screen hero photos (components/site/photo.tsx), 75 elsewhere.
    qualities: [75, 85],
  },

  async rewrites() {
    return [{ source: '/api/media/:path*', destination: `${process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:8010'}/media/:path*` }]
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders() },
      // Administrative image previews can reference external HTTPS images.
      { source: "/admin/:path*", headers: securityHeaders({ anyImageHost: true }) },
    ];
  },
};

/** Origin of the API, so `connect-src` can name it rather than open up. */
function apiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;

  if (!raw) return "";

  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

function contentSecurityPolicy({ anyImageHost = false } = {}): string {
  const dev = process.env.NODE_ENV === "development";

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Next streams inline RSC scripts; nonce-based CSP requires dynamic rendering.
    // 'wasm-unsafe-eval' lets the Google 3D map decode Draco-compressed
    // meshes in WebAssembly; it does not allow eval() of scripts.
    "script-src": ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "font-src": ["'self'", "data:"],
    "img-src": anyImageHost
      ? ["'self'", "data:", "blob:", "https:", ...(dev ? ["http:"] : [])]
      : ["'self'", "data:", "blob:", ...mapTileOrigins, ...(process.env.MEDIA_HOST ? [`https://${process.env.MEDIA_HOST}`] : [])],
    // The village map fetches its terrain and imagery tiles itself.
    "connect-src": ["'self'", apiOrigin(), ...mapTileOrigins].filter(Boolean),
    // MapLibre starts its renderer from /vendor and from blob: URLs.
    "worker-src": ["'self'", "blob:"],
    "frame-src": ["'none'"],
    "frame-ancestors": ["'none'"],

    "base-uri": ["'self'"],
    "form-action": ["'self'"],

    "object-src": ["'none'"],
  };

  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
  return dev ? policy : `${policy}; upgrade-insecure-requests`;
}

function securityHeaders({ anyImageHost = false } = {}) {
  const headers = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy({ anyImageHost }) },
    { key: "X-Frame-Options", value: "DENY" },

    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
    },
  ];

  if (process.env.NODE_ENV !== "development") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}

export default nextConfig;

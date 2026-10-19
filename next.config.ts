import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // geolocation powers "Locate me"; nothing else is needed
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

// Production CSP: the page may only talk to its own server (all geocoding & NASA requests are
// proxied server-side), load scripts/styles/fonts from itself, and show images from itself or
// https (NASA archive thumbnails). Inline scripts/styles are needed by Next.js hydration & React.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

if (process.env.NODE_ENV === 'production') {
  securityHeaders.push({ key: "Content-Security-Policy", value: contentSecurityPolicy });
}

const nextConfig: NextConfig = {
  output: "standalone",
  // type errors fail the build again (they were silently ignored before)
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

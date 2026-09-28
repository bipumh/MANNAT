import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root so the parent repo's lockfile (this
  // project lives inside a workspace folder) isn't misdetected.
  turbopack: {
    root: process.cwd(),
  },
  // Keep the dev overlay clear of the header's action buttons.
  devIndicators: {
    position: "bottom-right",
  },
  // Minimal, non-breaking security headers. No CSP (the app relies on inline
  // scripts/styles from Next.js); these just harden the baseline.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

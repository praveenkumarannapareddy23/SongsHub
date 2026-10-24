import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["song-hub-mu.vercel.app"],

  // ─── Server-Side Native Modules ───
  // Do NOT bundle firebase-admin into the serverless function. It (via
  // jwks-rsa) depends on jose, which ships as pure ESM; when webpack
  // bundles it as CJS, Node throws ERR_REQUIRE_ESM at runtime.
  // Externalizing lets Node's native require()/import() handle the ESM
  // boundary, which works on Node >= 22.12 (project engine: 24.x).
  serverExternalPackages: ["firebase-admin"],

  // ─── Image Optimization ───
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      // ─── Firebase & Auth Images ───
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      // ─── Supabase Storage ───
      { protocol: "https", hostname: "*.supabase.co" },
      // ─── Category Artwork Images ───
      { protocol: "https", hostname: "thumbs.dreamstime.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "miriammiles.com" },
      { protocol: "https", hostname: "media.istockphoto.com" },
      { protocol: "https", hostname: "hcog.tv" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "static.vecteezy.com" },
      { protocol: "https", hostname: "t4.ftcdn.net" },
      { protocol: "https", hostname: "c4.wallpaperflare.com" },
      { protocol: "https", hostname: "i.swncdn.com" },
      { protocol: "https", hostname: "t3.ftcdn.net" },
    ],
  },

  // ─── Cache Headers for Static Assets ───
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      },
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  // ─── Permanent Redirects ───
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/home/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

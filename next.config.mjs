const isDev = process.env.NODE_ENV !== "production";

const makeCsp = (frameSrc, ancestors) => [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://plausible.io https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://plausible.io",
  `frame-src ${frameSrc}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  `frame-ancestors ${ancestors}`,
].join("; ");
const csp = makeCsp("'self' https://challenges.cloudflare.com https://www.openstreetmap.org https://calendly.com", "'none'");
// aperçu de l'éditeur de pages (/admin/preview) : même origine uniquement
const cspPreview = makeCsp("'none'", "'self'");

const headersFor = (policy, frame) => [
  { key: "Content-Security-Policy", value: policy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: frame },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"], remotePatterns: [{ protocol: "https", hostname: "**" }] },
  experimental: { optimizePackageImports: ["framer-motion", "@react-three/drei"] },
  async headers() {
    return [
      { source: "/admin/preview", headers: headersFor(cspPreview, "SAMEORIGIN") },
      { source: "/:path((?!admin/preview$).*)", headers: headersFor(csp, "DENY") },
    ];
  },
};
export default nextConfig;

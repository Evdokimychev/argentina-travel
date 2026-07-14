import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import path from "node:path";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const hasExternalMediaCdn = Boolean(process.env.NEXT_PUBLIC_MEDIA_CDN_URL?.trim());
const disableNextImageOptimization =
  process.env.NEXT_PUBLIC_DISABLE_NEXT_IMAGE_OPTIMIZATION === "true" || hasExternalMediaCdn;
const isDemoBuild =
  process.env.NEXT_PUBLIC_APP_MODE === "demo" ||
  (!process.env.NEXT_PUBLIC_APP_MODE &&
    process.env.NODE_ENV !== "production" &&
    process.env.DEPLOY_ENV !== "production" &&
    process.env.DEPLOY_ENV !== "staging");

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Не даём одной странице блокировать сборку бесконечно (Vercel hard limit ~45 мин).
  staticPageGenerationTimeout: 180,
  // Keep Supabase in Node externals — avoids brittle vendor-chunks/@supabase.js in dev workers.
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr", "@react-pdf/renderer"],
  webpack: (config) => {
    if (isDemoBuild) {
      config.resolve.alias["@/lib/auth-provider-active"] = path.resolve(
        process.cwd(),
        "src/lib/auth-provider-active.demo.ts"
      );
    }
    config.module.rules.push({
      test: /\.geojson$/,
      type: "json",
    });
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/map",
        destination: "/mapa-argentina",
        permanent: true,
      },
      {
        source: "/blog/blue-dollar-argentina-2025",
        destination: "/blog/blue-dollar-argentina-2026",
        permanent: true,
      },
      {
        source: "/blog/argentina-tourist-visa-2025",
        destination: "/blog/argentina-tourist-visa-2026",
        permanent: true,
      },
    ];
  },
  images: {
    // Vercel image optimization can return 402 when quota/billing blocks optimizer requests.
    // The project serves curated media from its own CDN, so prefer visible images over broken cards.
    unoptimized: disableNextImageOptimization,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "experience.tripster.ru",
      },
      {
        protocol: "https",
        hostname: "**.tripster.ru",
      },
      {
        protocol: "https",
        hostname: "www.sputnik8.com",
      },
      {
        protocol: "https",
        hostname: "**.sputnik8.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sputnik8.com",
      },
      {
        protocol: "https",
        hostname: "**.selcdn.net",
      },
      {
        protocol: "https",
        hostname: "app.wegotrip.com",
      },
      {
        protocol: "https",
        hostname: "wgt-prod-storage.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "goargentina.ru",
      },
      {
        protocol: "https",
        hostname: "media.goargentina.ru",
      },
      {
        protocol: "https",
        hostname: "www.argentina.travel",
      },
      {
        protocol: "https",
        hostname: "argentina.travel",
      },
      {
        protocol: "https",
        hostname: "**.argentina.travel",
      },
      {
        protocol: "https",
        hostname: "**.youtravel.me",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);

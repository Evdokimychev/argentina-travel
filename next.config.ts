import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Keep Supabase in Node externals — avoids brittle vendor-chunks/@supabase.js in dev workers.
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr", "@react-pdf/renderer"],
  webpack: (config) => {
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
    ],
  },
};

export default withBundleAnalyzer(nextConfig);

import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import path from "node:path";
import { loadKnowledgeArchiveRedirects } from "./src/lib/seo/knowledge-archive-redirects";
import { LEGACY_WP_TOUR_REDIRECTS } from "./src/lib/seo/legacy-tour-redirects";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Metadata is operational content on this portal: titles, descriptions and
// indexing rules can come from the admin control plane. Keep it in the real
// document <head> for every user agent instead of streaming it into <body>.
// This also makes mobile Lighthouse and less common search crawlers observe
// the same metadata as Google/Yandex. The root layout already awaits the same
// settings, so streaming metadata does not buy us an earlier usable shell.
const htmlLimitedBots = /.*/;

const imageOptimizationOverride =
  process.env.NEXT_PUBLIC_DISABLE_NEXT_IMAGE_OPTIMIZATION?.trim();
const disableNextImageOptimization =
  imageOptimizationOverride === "true" ||
  (process.env.VERCEL === "1" && imageOptimizationOverride !== "false");
const mediaCdnRemotePattern = (() => {
  const raw = process.env.NEXT_PUBLIC_MEDIA_CDN_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return {
      protocol: url.protocol.slice(0, -1) as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/media/**",
    };
  } catch {
    return null;
  }
})();
const isDemoBuild =
  process.env.NEXT_PUBLIC_APP_MODE === "demo" ||
  (!process.env.NEXT_PUBLIC_APP_MODE &&
    process.env.NODE_ENV !== "production" &&
    process.env.DEPLOY_ENV !== "production" &&
    process.env.DEPLOY_ENV !== "staging");

const knowledgeArchiveRedirects = loadKnowledgeArchiveRedirects();

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  htmlLimitedBots,
  // Local production previews use a dedicated directory so an IDE-managed
  // `next dev` process cannot overwrite the production bundle in `.next`.
  distDir: process.env.NEXT_DIST_DIR?.trim() || ".next",
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
      config.resolve.alias["@/lib/bookings-demo-seeds-active"] = path.resolve(
        process.cwd(),
        "src/lib/bookings-demo-seeds-active.demo.ts"
      );
      config.resolve.alias["@/lib/reviews-demo-seeds-active"] = path.resolve(
        process.cwd(),
        "src/lib/reviews-demo-seeds-active.demo.ts"
      );
      config.resolve.alias["@/lib/waitlist-demo-seeds-active"] = path.resolve(
        process.cwd(),
        "src/lib/waitlist-demo-seeds-active.demo.ts"
      );
      config.resolve.alias["@/data/tour-private-seeds"] = path.resolve(
        process.cwd(),
        "src/data/tour-private-seeds.demo.ts"
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
      ...knowledgeArchiveRedirects,
      ...LEGACY_WP_TOUR_REDIRECTS,
      {
        source: "/st_tour/:path*",
        destination: "/tours",
        permanent: true,
      },
      {
        source: "/st_activity/:path*",
        destination: "/excursions",
        permanent: true,
      },
      {
        source: "/st_location/:path*",
        destination: "/places",
        permanent: true,
      },
      {
        source: "/map",
        destination: "/mapa-argentina",
        permanent: true,
      },
      {
        source: "/contact",
        destination: "/contacts",
        permanent: true,
      },
      {
        source: "/privacy-policy",
        destination: "/legal/privacy",
        permanent: true,
      },
      {
        source: "/politika-konfidencialnosti",
        destination: "/legal/privacy",
        permanent: true,
      },
      {
        source: "/about-us",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/o-nas",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/migration",
        destination: "/immigration",
        permanent: true,
      },
      {
        source: "/migration/:path*",
        destination: "/immigration/:path*",
        permanent: true,
      },
      {
        source: "/migratsiya",
        destination: "/immigration",
        permanent: true,
      },
      {
        source: "/migraciya",
        destination: "/immigration",
        permanent: true,
      },
      {
        source: "/pereezd",
        destination: "/immigration",
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
      {
        source: "/baza-znaniy/ciudad-de-salta",
        destination: "/baza-znaniy/salta",
        permanent: true,
      },
      {
        source: "/baza-znaniy/parque-nacional-los-cardones",
        destination: "/baza-znaniy/los-cardones",
        permanent: true,
      },
      {
        source: "/baza-znaniy/parque-nacional-tierra-del-fuego",
        destination: "/baza-znaniy/ognennaya-zemlya",
        permanent: true,
      },
      {
        source: "/baza-znaniy/aep-eze-stykovka",
        destination: "/baza-znaniy/aeroporty",
        permanent: true,
      },
      {
        source: "/excursions/city/city-151",
        destination: "/excursions/city/Buenos_Aires",
        permanent: true,
      },
      {
        source: "/excursions/city/Puerto_Iguasu",
        destination: "/destinations/iguazu",
        permanent: true,
      },
      {
        source: "/excursions/city/Puerto_Iguazu",
        destination: "/destinations/iguazu",
        permanent: true,
      },
    ];
  },
  images: {
    // Vercel's metered optimizer returns 402 after the project quota is spent.
    // Serve responsive source images directly there; an explicit false opt-in
    // can restore the optimizer after a paid quota or custom loader is ready.
    unoptimized: disableNextImageOptimization,
    qualities: [60, 75],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [32, 48, 64, 96, 128, 160, 256, 384],
    localPatterns: [
      {
        pathname: "/media/**",
      },
      {
        pathname: "/airlines/**",
      },
      {
        pathname: "/logo-light.svg",
      },
      {
        pathname: "/api/media/partner-image",
      },
    ],
    remotePatterns: [
      ...(mediaCdnRemotePattern ? [mediaCdnRemotePattern] : []),
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

const analyzedConfig = withBundleAnalyzer(nextConfig);

export default withSentryConfig(analyzedConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});

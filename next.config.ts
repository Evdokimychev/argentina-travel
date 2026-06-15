import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Supabase in Node externals — avoids brittle vendor-chunks/@supabase.js in dev workers.
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
  images: {
    remotePatterns: [
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
    ],
  },
};

export default nextConfig;

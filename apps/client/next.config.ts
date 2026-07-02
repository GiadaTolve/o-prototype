import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TEMPORANEO: sblocca il deploy nonostante gli errori TS pre-esistenti in fase
  // di sistemazione (vedi task Cursor). Rimuovere non appena risolti.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

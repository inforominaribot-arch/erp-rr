import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Listas de precios de proveedores (Excel / PDF) que se suben desde Administración
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        // Aplica CORS a todos los endpoints de sincronización móvil
        source: "/api/mediciones/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, x-sync-api-key" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;

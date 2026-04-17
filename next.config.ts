import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'pg-native', 'bcryptjs', 'jsonwebtoken'],
};

export default nextConfig;

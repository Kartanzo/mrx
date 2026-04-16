import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', 'pg-native', 'bcryptjs', 'jsonwebtoken'],
};

export default nextConfig;

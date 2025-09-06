import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Help with debugging React errors
  reactStrictMode: true,
  
  // Better error handling for development
  compiler: {
    removeConsole: false,
  },
};

export default nextConfig;

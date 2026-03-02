import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
       {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                pathname: '**',
      },
       {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '**',
            },
    ],
  },
};

export default nextConfig;
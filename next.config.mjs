/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: "",
    output: "export",
    images: {
        unoptimized: true,
        domains: ['placehold.jp'],
      },
};

export default nextConfig;

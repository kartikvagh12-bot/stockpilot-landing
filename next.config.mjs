/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Permanent (308) redirect from the legacy Vercel preview domain to
      // the canonical Operza domain. The `has: host` matcher scopes the
      // rule to requests whose Host header is exactly `operza.vercel.app`,
      // so production custom domains (`www.operza.in`, apex `operza.in`)
      // are untouched. `:path*` preserves the full subpath; the query
      // string is forwarded automatically.
      {
        source: "/:path*",
        has: [{ type: "host", value: "operza.vercel.app" }],
        destination: "https://www.operza.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

import { withBotId } from "botid/next/config";

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

// Vercel BotID (the assistant's bot check). The installed botid 1.5.13 README
// asks Next.js projects to wrap the config with withBotId, which adds two
// rewrites and a frame-ancestors header for BotID's own fixed path
// (/149e9513-01fa-4fb0-aad4-566afd725d1b/...) and keeps everything else,
// including the redirect above. Vercel's current docs say these requests are
// routed automatically; the wrapper is harmless in that case and needed if
// not. It is applied only when the assistant is enabled for the build, so
// with the assistant off the site's configuration is exactly as before.
export default process.env.ASSISTANT_ENABLED === "true" ? withBotId(nextConfig) : nextConfig;

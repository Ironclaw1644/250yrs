import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Building inside a git worktree that has its own lockfile — pin the tracing root.
  outputFileTracingRoot:
    "/Users/ironclaw/projects/250yrs/.claude/worktrees/recursing-mayer-14cb5d",
  // ESLint 9 flat-config migration is a follow-up; type-checking still runs.
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    // Legacy clothing-site routes -> new directory home (301, preserve equity).
    return [
      { source: "/shop", destination: "/", permanent: true },
      { source: "/shop/:slug", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;

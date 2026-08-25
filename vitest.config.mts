import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Integration tests share one scratch database, so they must not run
    // against each other. Unit tests do not care either way.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/app/(app)/_leads/stages.ts"],
    },
  },
});

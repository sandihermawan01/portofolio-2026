import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // tests/rules/** needs the Firestore Emulator running and is run
    // separately via `npm run test:rules` (which wraps it with
    // `firebase emulators:exec`); excluding it here keeps the default
    // `npm run test` a plain, emulator-free unit test run.
    include: ["tests/**/*.test.ts"],
    exclude: ["**/node_modules/**", "tests/rules/**"],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});

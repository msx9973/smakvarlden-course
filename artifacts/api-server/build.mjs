import { build } from "esbuild";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const esbuildPluginPino = require("esbuild-plugin-pino");

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outdir: "dist",
  entryNames: "[name]",
  outExtension: { ".js": ".mjs" },
  external: [
    "node:*",
    "@anthropic-ai/sdk",
    "bcryptjs",
    "cookie-parser",
    "cors",
    "drizzle-orm",
    "drizzle-orm/*",
    "express",
    "jsonwebtoken",
    "pg",
    "pino",
    "pino-http",
    "pino-pretty",
  ],
  sourcemap: true,
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
});

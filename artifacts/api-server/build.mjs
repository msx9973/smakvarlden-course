import { build } from "esbuild";
import { esbuildPluginPino } from "esbuild-plugin-pino";
import { createRequire } from "module";

// esbuild-plugin-pino uses require.resolve internally — inject it
globalThis.require = createRequire(import.meta.url);

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  sourcemap: true,
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
  logLevel: "info",
});

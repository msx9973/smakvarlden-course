import { build } from "esbuild";
import { esbuildPluginPino } from "esbuild-plugin-pino";
import { createRequire } from "module";

// esbuild-plugin-pino uses require.resolve internally — inject it
globalThis.require = createRequire(import.meta.url);

// Main server bundle (node HTTP server with pino workers)
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

// Netlify Function bundle (serverless handler, no pino workers needed)
await build({
  entryPoints: { "api": "src/lambda.ts" },
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outdir: "../../netlify/functions",
  outExtension: { ".js": ".mjs" },
  sourcemap: false,
  logLevel: "info",
  // serverless-http uses CJS require() for Node built-ins — inject a shim so it works in ESM
  banner: {
    js: "import { createRequire } from 'module';\nconst require = createRequire(import.meta.url);\n",
  },
});

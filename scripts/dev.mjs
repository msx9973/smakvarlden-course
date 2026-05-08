import { spawn } from "node:child_process";

const processes = [
  {
    name: "api",
    args: ["--filter", "@workspace/api-server", "run", "dev"],
    env: {
      NODE_ENV: "development",
      PORT: "5000",
    },
  },
  {
    name: "web",
    args: ["--filter", "@workspace/smakvarlden", "run", "dev"],
    env: {
      PORT: "5173",
      API_URL: "http://127.0.0.1:5000",
    },
  },
];

const children = processes.map(({ name, args, env }) => {
  const command = ["corepack", "pnpm", ...args].join(" ");
  const child = spawn(command, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      ...env,
    },
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      stopAll();
      process.exit(code);
    }
  });

  return child;
});

function stopAll() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});

console.log("Smakvarlden is starting...");
console.log("Frontend: http://localhost:5173");
console.log("API:      http://localhost:5000/api");

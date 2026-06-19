#!/usr/bin/env node
/** Force-clean dev start. Alias for `node scripts/dev.mjs --clean`. */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const devScript = path.join(__dirname, "dev.mjs");

const child = spawn(process.execPath, [devScript, "--clean"], {
  cwd: path.resolve(__dirname, ".."),
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));

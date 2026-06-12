#!/usr/bin/env node
/**
 * AxioRank PreToolUse auto-scan hook.
 *
 * Reads the PreToolUse event JSON on stdin, runs the relevant content through
 * AxioRank's keyless local engine (`@axiorank/sdk scan`), and blocks the tool
 * call only when the engine returns a hard DENY (a leaked secret, a destructive
 * operation, or risk >= 75).
 *
 * Design principles:
 *  - Fail-open. Any error, timeout, or ambiguous result lets the tool call
 *    proceed. The hook must never brick a session.
 *  - No false blocks. We treat the result as a deny only when the scanner
 *    actually printed a DENY verdict, so a flaky `npx` download or a network
 *    error (which can also exit non-zero) never blocks a benign action.
 *  - Zero dependencies. Pure Node, no jq, no install step.
 *
 * Env knobs:
 *  - AXIORANK_HOOK_DISABLE=1   skip scanning entirely (allow everything).
 *  - AXIORANK_HOOK_TIMEOUT_MS  scanner timeout in ms (default 10000).
 *  - AXIORANK_SDK_BIN          override the scanner command (default: the
 *                              `axiorank-sdk` global binary if on PATH, else
 *                              `npx -y @axiorank/sdk`).
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, delimiter } from "node:path";

const ALLOW = 0; // exit 0 with no stdout => no decision => tool proceeds normally.

function allow() {
  process.exit(ALLOW);
}

function deny(toolName, findings) {
  const reason =
    `AxioRank blocked this ${toolName} call. The local detectors found a ` +
    `high-risk signal (leaked secret, destructive operation, or risk >= 75).\n\n` +
    findings.trim() +
    `\n\nFix the flagged issue, or if this is a deliberate and safe action, ` +
    `retry with the AxioRank hook disabled for this step ` +
    `(set AXIORANK_HOOK_DISABLE=1).`;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(ALLOW); // exit 0 + JSON is how a PreToolUse hook reports a deny.
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function which(bin) {
  const paths = (process.env.PATH || "").split(delimiter);
  const names =
    process.platform === "win32" ? [bin + ".cmd", bin + ".exe", bin] : [bin];
  for (const dir of paths) {
    if (!dir) continue;
    for (const name of names) {
      const full = join(dir, name);
      if (existsSync(full)) return full;
    }
  }
  return null;
}

function resolveScanner() {
  const override = process.env.AXIORANK_SDK_BIN;
  if (override && override.trim()) {
    const parts = override.trim().split(/\s+/);
    return { cmd: parts[0], pre: parts.slice(1) };
  }
  const local = which("axiorank-sdk");
  if (local) return { cmd: local, pre: [] };
  return { cmd: "npx", pre: ["-y", "@axiorank/sdk"] };
}

function buildPayload(toolName, toolInput) {
  const ti = toolInput && typeof toolInput === "object" ? toolInput : {};
  switch (toolName) {
    case "Bash":
      return {
        tool: "shell.exec",
        arguments: { command: String(ti.command ?? "") },
      };
    case "Write":
      return {
        tool: "fs.write",
        arguments: {
          path: String(ti.file_path ?? ""),
          content: String(ti.content ?? ""),
        },
      };
    case "Edit":
      return {
        tool: "fs.write",
        arguments: {
          path: String(ti.file_path ?? ""),
          content: String(ti.new_string ?? ""),
        },
      };
    default:
      return null; // not a tool we scan
  }
}

function main() {
  if (process.env.AXIORANK_HOOK_DISABLE) allow();

  const raw = readStdin();
  if (!raw.trim()) allow();

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    allow();
    return;
  }

  const toolName = event && event.tool_name;
  const payload = buildPayload(toolName, event && event.tool_input);
  if (!payload) allow();

  // Nothing to scan (empty command/content): don't pay the scanner cost.
  const hasContent =
    (payload.arguments.command && payload.arguments.command.length > 0) ||
    (payload.arguments.content && payload.arguments.content.length > 0);
  if (!hasContent) allow();

  const timeoutRaw = Number(process.env.AXIORANK_HOOK_TIMEOUT_MS || 10000);
  const timeout = Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 10000;
  const { cmd, pre } = resolveScanner();

  let res;
  try {
    res = spawnSync(cmd, [...pre, "scan"], {
      input: JSON.stringify(payload),
      encoding: "utf8",
      timeout,
      maxBuffer: 5 * 1024 * 1024,
      env: { ...process.env, NO_COLOR: "1" },
    });
  } catch {
    allow(); // spawn threw => fail open
    return;
  }

  // Fail open on spawn error, timeout (status null), or any non-deny status.
  if (!res || res.error || res.status === null) allow();

  const out = res.stdout || "";
  // Only block on a genuine DENY verdict the scanner actually printed.
  // status === 1 alone is not enough (npx/network failures can also exit 1).
  const denied = res.status === 1 && /\bDENY\b/.test(out);
  if (denied) {
    deny(String(toolName), out);
  }
  allow();
}

main();

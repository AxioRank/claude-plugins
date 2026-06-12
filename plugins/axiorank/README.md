# axiorank (Claude Code plugin)

Zero-Trust guardrails for Claude Code. Catch leaked secrets, prompt injection,
PII, and destructive tool calls. The detection engine runs locally with no API
key, no network, and no signup.

## Install

```
/plugin marketplace add AxioRank/claude-plugins
/plugin install axiorank@axiorank
/axiorank:demo
```

## Components

- **`/axiorank:scan`** inspect a tool-call JSON, a file, or pasted content.
- **`/axiorank:demo`** score five built-in scenarios to see it work.
- **Security skill** (model-invoked) vets a risky action or untrusted text when
  the context calls for it.
- **`axiorank-security-reviewer`** subagent reviews a diff or files before commit.
- **PreToolUse auto-scan hook** blocks Bash, Write, and Edit on a hard DENY
  (leaked secret or destructive operation). Fail-open by design.
- **`axiorank` MCP server** the hosted control plane. Discovery needs no key;
  governance tools activate when `AXIORANK_KEY` is set.

## Hook environment knobs

- `AXIORANK_HOOK_DISABLE=1` turn the hook off without uninstalling.
- `AXIORANK_HOOK_TIMEOUT_MS` scanner timeout in ms (default `10000`).
- `AXIORANK_SDK_BIN` override the scanner command.

For the snappiest hook, `npm install -g @axiorank/sdk` so it skips `npx`.

Powered by [`@axiorank/sdk`](https://www.npmjs.com/package/@axiorank/sdk).
AxioRank: <https://axiorank.com>. MIT licensed.

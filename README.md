# AxioRank for Claude Code

Zero-Trust guardrails for AI coding agents, packaged as a Claude Code plugin.

AxioRank inspects what your agent is about to do (run a shell command, write a
file, query a database, post to a webhook) and what it is about to trust (tool
results, fetched pages, issues) for **leaked secrets, prompt injection, PII, and
destructive operations**. The detection engine runs locally with **no API key,
no network, and no signup**, so you see a real result in seconds.

This repository is both an AxioRank-owned plugin marketplace and the plugin
itself.

## Install (about 10 seconds)

Inside Claude Code:

```
/plugin marketplace add AxioRank/claude-plugins
/plugin install axiorank@axiorank
```

That is it. Try it right away:

```
/axiorank:demo
```

## What you get

| Surface | What it does |
| :------ | :----------- |
| `/axiorank:demo` | Scores five built-in attack and benign tool calls so you can watch the detectors work with zero setup. |
| `/axiorank:scan` | Inspect a tool-call JSON, a file, or pasted content on demand. Reports the decision, risk score, and every signal with redacted evidence. |
| Security skill | Model-invoked. Claude vets a risky action before taking it, or untrusted text before trusting it, when the context calls for it. |
| `axiorank-security-reviewer` subagent | Reviews a diff or files for secrets, PII, injection sinks, and destructive operations, confirming each finding with the engine. Run it before a commit. |
| Auto-scan hook | A PreToolUse hook that scans every Bash, Write, and Edit through the engine and blocks the call when it finds a leaked secret or destructive operation. |
| AxioRank MCP server | The hosted Zero-Trust control plane, bundled and ready. Discovery works with no key; governance tools activate when you set `AXIORANK_KEY`. |

All of it is powered by the same published package, `@axiorank/sdk`, which the
plugin invokes through `npx`. Nothing is vendored from a private repo.

## The auto-scan hook

Once the plugin is enabled, the hook runs before every `Bash`, `Write`, and
`Edit`. It builds a tool call from the content, runs it through
`@axiorank/sdk scan`, and **blocks the action only on a hard DENY**: a leaked
secret, a destructive operation, or risk at or above 75. Prompt injection and PII
are surfaced by the skill and the subagent rather than blocked here, to keep the
hook quiet on day-to-day work.

It is designed to never get in your way:

- **Fail-open.** Any error or timeout lets the action proceed. The hook cannot
  brick your session.
- **No false blocks.** It treats a result as a block only when the scanner
  actually prints a `DENY`, so a flaky download or an offline machine never
  blocks a benign action.

### Knobs

| Environment variable | Effect |
| :------------------- | :----- |
| `AXIORANK_HOOK_DISABLE=1` | Turn the hook off without uninstalling the plugin. |
| `AXIORANK_HOOK_TIMEOUT_MS` | Scanner timeout in milliseconds (default `10000`). |
| `AXIORANK_SDK_BIN` | Override the scanner command. |

**Speed tip:** the first `npx` run downloads `@axiorank/sdk` (a few seconds, then
it is cached). For the snappiest hook, install the CLI globally and the hook calls
it directly with no `npx` overhead:

```
npm install -g @axiorank/sdk
```

To disable just the hook permanently, you can also remove `hooks/hooks.json` from
your installed copy, or disable the plugin with `/plugin`.

## Optional: connect the hosted control plane

The bundled MCP server (`axiorank`) gives Claude AxioRank's governance tools:
score a tool call against your own policy with an audit trail and approvals,
verify a remote MCP server or agent card before you trust it, quarantine an
agent, and more. Discovery works with no key. To enable the tool calls, create a
free key at <https://www.axiorank.com> and export it before starting Claude Code:

```
export AXIORANK_KEY=axr_live_xxxxxxxxxxxxxxxx
```

## Repository layout

```
.claude-plugin/marketplace.json   the marketplace catalog
plugins/axiorank/                  the plugin
  .claude-plugin/plugin.json       plugin manifest
  skills/                          /axiorank:scan, /axiorank:demo, security skill
  agents/                          the security-reviewer subagent
  hooks/hooks.json                 the PreToolUse auto-scan hook
  scripts/scan-hook.mjs            the hook implementation (fail-open)
  .mcp.json                        the bundled AxioRank MCP server
```

## Develop and validate

Test a local copy without installing:

```
claude --plugin-dir ./plugins/axiorank
```

Validate the marketplace and the plugin:

```
claude plugin validate .
claude plugin validate ./plugins/axiorank
```

## License

MIT. See [LICENSE](LICENSE).

AxioRank: <https://axiorank.com>

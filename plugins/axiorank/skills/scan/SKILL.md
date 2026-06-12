---
description: Inspect a tool call, file, or pasted content for leaked secrets, PII, prompt injection, and destructive operations using AxioRank's keyless local detectors. No API key required.
disable-model-invocation: true
---

# AxioRank Scan

Inspect the user's input for security risks using AxioRank's local detection
engine. It runs entirely on the machine: no API key, no network, no signup.

The user input is: `$ARGUMENTS`

## How to run it

Decide which form the input takes and run the matching command with the `Bash`
tool. Always set `NO_COLOR=1` so the output is clean text you can read back.

1. **A file path** (the argument points at a real file on disk):
   ```bash
   NO_COLOR=1 npx -y @axiorank/sdk scan "<path>"
   ```

2. **A tool-call JSON** (the argument looks like
   `{"tool":"db.query","arguments":{"sql":"DROP TABLE users"}}`): write it to a
   temp file and scan that file, which avoids shell-quoting problems:
   ```bash
   printf '%s' '<the json>' > /tmp/axiorank-scan.json && NO_COLOR=1 npx -y @axiorank/sdk scan /tmp/axiorank-scan.json
   ```

3. **Free-form content to inspect** (a snippet, a command, some text): wrap it as
   a tool call so the engine can score it, then scan as in case 2:
   `{"tool":"inspect.text","arguments":{"text":"<the content>"}}`.

4. **No argument given**: ask the user for the tool-call JSON or file to inspect,
   or suggest they run `/axiorank:demo` to see it work on built-in examples.

## How to report the result

The CLI prints a verdict line (`ALLOW` or `DENY` with a risk score 0 to 100),
a one-line reason, and a list of signals (each with a severity, the detector
name, a location, a label, and redacted evidence). The exit code is `1` when the
decision is `DENY`, `0` otherwise.

Summarize for the user:

- The **decision** (allow / deny) and the **risk score**.
- Each **signal**: which detector fired, the severity, and the redacted evidence.
- Concrete **remediation** for anything denied or flagged (for example: move the
  secret to an environment variable, parameterize the query, drop the webhook).

Note for the user when relevant: the local engine denies on leaked secrets,
destructive operations, and risk at or above 75. Prompt injection and PII are
surfaced as flagged-but-allowed so a stricter central policy can act on them. A
free key at https://www.axiorank.com adds central enforcement, an audit trail,
approvals, and kill-chain correlation.

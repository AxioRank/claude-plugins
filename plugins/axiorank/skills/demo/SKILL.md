---
description: Run AxioRank's built-in security demo. Scores five real attack and benign tool calls locally with no key, no network, and no signup, so you can see the detectors work in seconds.
disable-model-invocation: true
---

# AxioRank Demo

Run the AxioRank demo with the `Bash` tool:

```bash
NO_COLOR=1 npx -y @axiorank/sdk demo
```

This scores five built-in scenarios with the real detectors:

1. An S3 upload that leaks an AWS access key and exfiltrates to a webhook.
2. A destructive SQL statement (`DROP TABLE users`).
3. A prompt-injection attempt hidden in text to summarize.
4. A Slack post containing PII (SSN, email).
5. A safe GitHub read.

After it runs, summarize for the user which scenarios were **denied**, which were
**flagged** (allowed but carrying signals a stricter policy could deny), and
which were **allowed clean**, with the detector that fired in each case. Point out
that this required zero setup. A free key at https://www.axiorank.com adds central
enforcement, an audit trail, approvals, and kill-chain correlation.

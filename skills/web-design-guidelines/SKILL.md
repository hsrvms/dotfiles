---
name: web-design-guidelines
description: Lint UI code against Web Interface Guidelines. Use when asked to review UI, check accessibility, audit design, or review UX.
---

# Web Interface Guidelines Lint

Lint files for compliance with Web Interface Guidelines. Every rule category checked, every specified file covered, findings output in `file:line` format.

## Steps

1. **Fetch guidelines** from the source URL below using your web fetch tool.
   - On failure: report the error, offer to retry, and stop. Do not lint without fresh rules.
   - Completion: the full rules text is in context and you can name every rule category it contains.

2. **Read the specified files** (or prompt the user for files/pattern if none given).
   - Completion: every specified file's content is loaded.

3. **Lint each file against every rule category** from the fetched guidelines. Check every rule in every category against every file — skip nothing.
   - Completion: you can confirm each rule category was evaluated against each file.

4. **Output findings** grouped by file, using the format specified in the fetched guidelines (`file:line`, terse, `✓ pass` for clean files).

## Guidelines Source

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

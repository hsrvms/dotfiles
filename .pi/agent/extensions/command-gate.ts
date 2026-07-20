// command-gate.ts
//
// Global pi extension that gates the built-in `bash` tool:
//
//   1. Remove commands (`rm`, `rmdir`, `unlink`, `shred`, `find ... -delete`,
//      `git clean`) require an interactive confirmation before they run.
//   2. `sudo` commands prompt you for a password, then run through
//      `sudo -A` (SUDO_ASKPASS) so the command can succeed against a real
//      password prompt instead of the model retrying workarounds.
//
// The password is written to a single-use askpass helper file (mode 0700) plus
// a password file (mode 0600), referenced by path, and removed via a trap after
// the command finishes. The password never appears in the bash command string
// that pi records in the session.
//
// In non-interactive modes (print / json) there is no UI to ask, so both
// remove and sudo commands are blocked as a fail-safe. RPC mode exposes
// confirm/input dialogs, so it still works.
//
// Auto-discovered from ~/.pi/agent/extensions/. Reload with /reload.

import { mkdtempSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isToolCallEventType, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Token patterns that count as "remove" commands. Matched as standalone words
// anywhere in the command string so compound commands are covered too.
const REMOVE_PATTERNS: RegExp[] = [
  /\brm\b/,
  /\brmdir\b/,
  /\bunlink\b/,
  /\bshred\b/,
  /\bfind\b[\s\S]*-delete\b/,
  /\bgit\b\s+clean\b/,
];

const SUDO_PATTERN = /\bsudo\b/;

function looksLikeRemove(command: string): boolean {
  return REMOVE_PATTERNS.some((re) => re.test(command));
}

// Escape a string for safe embedding inside single quotes in a shell script.
function singleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (!isToolCallEventType("bash", event)) return;
    const command = event.input.command;
    if (typeof command !== "string" || command.length === 0) return;

    const remove = looksLikeRemove(command);
    const sudo = SUDO_PATTERN.test(command);

    if (!remove && !sudo) return;

    // Fail-safe: without a UI we cannot ask for permission or a password.
    if (!ctx.hasUI) {
      return {
        block: true,
        reason:
          "command-gate: this command requires interactive confirmation " +
          "(remove and/or sudo) but the current mode has no UI. Re-run in " +
          "interactive/RPC mode to approve it.",
      };
    }

    // 1. Permission gate for destructive remove commands.
    if (remove) {
      const ok = await ctx.ui.confirm(
        "command-gate: allow remove command?",
        command,
      );
      if (!ok) {
        return {
          block: true,
          reason: "command-gate: remove command denied by user.",
        };
      }
    }

    // 2. Password capture for sudo so it runs instead of being worked around.
    if (sudo) {
      const password = await ctx.ui.input(
        "command-gate: sudo detected — enter password (stored only for this command):",
        "",
      );
      if (password === undefined) {
        return {
          block: true,
          reason: "command-gate: sudo command cancelled (no password entered).",
        };
      }

      // Stage the askpass helper + password in a private temp dir.
      const dir = mkdtempSync(join(tmpdir(), "pi-sudo-"));
      const pwFile = join(dir, "pw");
      const askpass = join(dir, "askpass");
      writeFileSync(pwFile, password, { mode: 0o600 });
      chmodSync(pwFile, 0o600);
      // The helper just echoes the password to stdout for `sudo -A`.
      writeFileSync(
        askpass,
        `#!/bin/sh\ncat ${singleQuote(pwFile)}\n`,
        { mode: 0o700 },
      );
      chmodSync(askpass, 0o700);

      // Replace every `sudo` with `sudo -A`, export SUDO_ASKPASS, and wrap in
      // a subshell with an EXIT trap so the temp files are always removed.
      const rewritten = command.replace(/\bsudo\b/g, "sudo -A");
      const wrapped =
        `( trap ${singleQuote(`rm -rf ${singleQuote(dir)}`)} EXIT; ` +
        `export SUDO_ASKPASS=${singleQuote(askpass)}; ` +
        `${rewritten} )`;

      event.input.command = wrapped;

      // Best-effort cleanup if the process is killed mid-command. The trap
      // inside the subshell is the primary cleanup path.
      ctx.signal?.addEventListener("abort", () => {
        rmSync(dir, { recursive: true, force: true });
      });
    }
  });
}

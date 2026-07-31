// command-gate.ts
//
// Global pi extension that gates the built-in `bash` tool:
//
//   1. Remove commands (`rm`, `rmdir`, `unlink`, `shred`, `find ... -delete`,
//      `git clean`) require an interactive confirmation before they run.
//   2. `sudo` commands prompt you for a masked password, then run through
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
// Flags:
//   --no-command-gate    Bypass all gating (remove + sudo pass through as-is).
//
// When a dialog is waiting for input, or when pi finishes a turn, the
// extension sends a desktop notification (OSC 777 / OSC 99 / Windows toast)
// so you know pi needs attention even if the terminal is in the background.
//
// Auto-discovered from ~/.pi/agent/extensions/. Reload with /reload.

import { mkdtempSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLocalBashOperations, isToolCallEventType, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { decodeKittyPrintable, matchesKey, Key } from "@earendil-works/pi-tui";

// ---------------------------------------------------------------------------
// Desktop notification helpers (OSC 777 / OSC 99 / Windows toast)
// ---------------------------------------------------------------------------

function notify(title: string, body: string): void {
  if (process.env.WT_SESSION) {
    // Windows Terminal (WSL)
    const { execFile } = require("node:child_process");
    execFile("powershell.exe", ["-NoProfile", "-Command", windowsToastScript(title, body)]);
  } else if (process.env.KITTY_WINDOW_ID) {
    // Kitty
    process.stdout.write(`\x1b]99;i=1:d=0;${title}\x1b\\`);
    process.stdout.write(`\x1b]99;i=1:p=body;${body}\x1b\\`);
  } else {
    // Ghostty, iTerm2, WezTerm, rxvt-unicode
    process.stdout.write(`\x1b]777;notify;${title};${body}\x07`);
  }
}

function windowsToastScript(title: string, body: string): string {
  const type = "Windows.UI.Notifications";
  const mgr = `[${type}.ToastNotificationManager, ${type}, ContentType = WindowsRuntime]`;
  const template = `[${type}.ToastTemplateType]::ToastText01`;
  const toast = `[${type}.ToastNotification]::new($xml)`;
  return [
    `${mgr} > $null`,
    `$xml = [${type}.ToastNotificationManager]::GetTemplateContent(${template})`,
    `$xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('${body}')) > $null`,
    `[${type}.ToastNotificationManager]::CreateToastNotifier('${title}').Show(${toast})`,
  ].join("; ");
}

// ---------------------------------------------------------------------------
// Masked password input (via ctx.ui.custom)
// ---------------------------------------------------------------------------

function visibleAnsiWidth(str: string): number {
  // Strip ANSI escape sequences before measuring visible width.
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "").length;
}

function passwordPrompt(ctx: Parameters<Parameters<ExtensionAPI["on"]>[1]>[1]): Promise<string | undefined> {
  return ctx.ui.custom<string | undefined>((tui, _theme, _keybindings, done) => {
    let value = "";

    return {
      render(width: number): string[] {
        const label = "command-gate: sudo detected — enter password (stored only for this command):";
        const masked = "*".repeat(value.length);
        // Inverse-video space as a block cursor, positioned after the masked text.
        const cursor = "\x1b[7m \x1b[27m";
        const inputLine = `> ${masked}${cursor}`;

        // Word-wrap the label to fit the available width.
        const labelLines: string[] = [];
        let remaining = label;
        while (remaining.length > 0) {
          labelLines.push(remaining.slice(0, width));
          remaining = remaining.slice(width);
        }

        const pad = " ".repeat(Math.max(0, width - visibleAnsiWidth(inputLine)));
        return [...labelLines, inputLine + pad];
      },

      handleInput(data: string): void {
        if (matchesKey(data, Key.enter)) {
          done(value);
          return;
        }
        if (matchesKey(data, Key.escape)) {
          done(undefined);
          return;
        }
        if (matchesKey(data, Key.backspace) || data === "\x7f") {
          if (value.length > 0) {
            value = value.slice(0, -1);
          }
          tui.requestRender();
          return;
        }
        // Kitty CSI-u: terminals with Kitty protocol encode printable
        // chars as e.g. \x1b[97u for 'a'. Decode first, then fall back
        // to the raw character loop for non-Kitty terminals.
        const kittyChar = decodeKittyPrintable(data);
        if (kittyChar !== undefined) {
          value += kittyChar;
          tui.requestRender();
          return;
        }
        // Accept printable characters only (ignore control chars).
        let changed = false;
        for (const ch of data) {
          const code = ch.charCodeAt(0);
          if (code >= 32 && code !== 0x7f) {
            value += ch;
            changed = true;
          }
        }
        if (changed) tui.requestRender();
      },

      invalidate(): void {},
    };
  });
}

// ---------------------------------------------------------------------------
// Command patterns
// ---------------------------------------------------------------------------

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
  // --no-command-gate bypasses all gating.
  pi.registerFlag("no-command-gate", {
    description: "Bypass command gate (remove + sudo pass through as-is)",
    type: "boolean",
    default: false,
  });

  // -----------------------------------------------------------------------
  // Work-done notification: fire a desktop notification when the agent
  // settles (finishes processing and has no more queued work).
  // -----------------------------------------------------------------------
  let workStarted = false;

  pi.on("agent_start", async () => {
    workStarted = true;
  });

  pi.on("agent_settled", async (_event, ctx) => {
    if (!workStarted) return;
    workStarted = false;
    if (!ctx.hasUI) return;
    notify("pi — done", "Work complete");
  });

  // -----------------------------------------------------------------------
  // Shared sudo helper: prompts for a masked password, stages askpass
  // files, and returns the wrapped command (or undefined if cancelled).
  // -----------------------------------------------------------------------
  async function gateSudo(
    command: string,
    ctx: Parameters<Parameters<ExtensionAPI["on"]>[1]>[1],
  ): Promise<string | undefined> {
    notify("pi — command-gate", "sudo command needs your password");
    const password = await passwordPrompt(ctx);
    if (password === undefined || password === "") return undefined;

    const dir = mkdtempSync(join(tmpdir(), "pi-sudo-"));
    const pwFile = join(dir, "pw");
    const askpass = join(dir, "askpass");
    writeFileSync(pwFile, password, { mode: 0o600 });
    chmodSync(pwFile, 0o600);
    // Self-destruct after one read so a wrong password isn't retried.
    writeFileSync(
      askpass,
      `#!/bin/sh\ncat ${singleQuote(pwFile)} 2>/dev/null; rm -f ${singleQuote(pwFile)}\n`,
      { mode: 0o700 },
    );
    chmodSync(askpass, 0o700);

    const rewritten = command.replace(/\bsudo\b/g, "sudo -A");
    return (
      `( trap ${singleQuote(`rm -rf ${singleQuote(dir)}`)} EXIT; ` +
      `export SUDO_ASKPASS=${singleQuote(askpass)}; ` +
      `${rewritten} )`
    );
  }

  // -----------------------------------------------------------------------
  // Shared gate entry point: returns "block" | "pass" | wrapped command.
  // -----------------------------------------------------------------------
  async function gateCommand(
    command: string,
    ctx: Parameters<Parameters<ExtensionAPI["on"]>[1]>[1],
  ): Promise<{ action: "block"; reason: string } | { action: "pass" } | { action: "rewrite"; command: string }> {
    const remove = looksLikeRemove(command);
    const sudo = SUDO_PATTERN.test(command);
    if (!remove && !sudo) return { action: "pass" };

    if (pi.getFlag("no-command-gate")) return { action: "pass" };

    if (!ctx.hasUI) {
      return {
        action: "block",
        reason:
          "command-gate: this command requires interactive confirmation " +
          "(remove and/or sudo) but the current mode has no UI. Re-run in " +
          "interactive/RPC mode to approve it.",
      };
    }

    if (remove) {
      notify("pi — command-gate", "Remove command needs approval");
      const ok = await ctx.ui.confirm(
        "command-gate: allow remove command?",
        command,
      );
      if (!ok) {
        return { action: "block", reason: "command-gate: remove command denied by user." };
      }
    }

    if (sudo) {
      const wrapped = await gateSudo(command, ctx);
      if (wrapped === undefined) {
        return { action: "block", reason: "command-gate: sudo command cancelled (no password entered)." };
      }
      return { action: "rewrite", command: wrapped };
    }

    return { action: "pass" };
  }

  // -----------------------------------------------------------------------
  // LLM-called bash tool: intercept and possibly rewrite the command.
  // -----------------------------------------------------------------------
  pi.on("tool_call", async (event, ctx) => {
    if (!isToolCallEventType("bash", event)) return;
    const command = event.input.command;
    if (typeof command !== "string" || command.length === 0) return;

    const result = await gateCommand(command, ctx);
    if (result.action === "block") {
      return { block: true, reason: result.reason };
    }
    if (result.action === "rewrite") {
      event.input.command = result.command;
      // Best-effort cleanup on abort: the trap inside the subshell is the
      // primary cleanup path, but this catches process kills.
      ctx.signal?.addEventListener("abort", () => {
        // The temp dir path is embedded in the command; parse it out.
        const match = result.command.match(/rm -rf (.+?)\'/);
        if (match) {
          rmSync(match[1], { recursive: true, force: true });
        }
      });
    }
  });

  // -----------------------------------------------------------------------
  // User `!` commands: intercept and gate remove/sudo typed by the user.
  // -----------------------------------------------------------------------
  pi.on("user_bash", async (event, ctx) => {
    const command = event.command;
    if (typeof command !== "string" || command.length === 0) return;

    const result = await gateCommand(command, ctx);
    if (result.action === "pass") return;

    if (result.action === "block") {
      return {
        result: {
          output: result.reason,
          exitCode: 1,
          cancelled: false,
          truncated: false,
        },
      };
    }

    // result.action === "rewrite": execute the wrapped command.
    const local = createLocalBashOperations();
    return {
      operations: {
        exec(cmd, cwd, options) {
          return local.exec(result.command, cwd, options);
        },
      },
    };
  });
}
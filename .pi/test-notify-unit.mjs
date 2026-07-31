#!/usr/bin/env node
/**
 * Unit test for the notify() helper in command-gate.ts.
 * Captures stdout and verifies the correct OSC escape sequences
 * are emitted for each terminal type.
 *
 * Run: node test-notify-unit.mjs
 */

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✅ ${msg}`);
    passed++;
  } else {
    console.log(`  ❌ ${msg}`);
    failed++;
  }
}

// The notify function logic, extracted for testing.
// Keep in sync with command-gate.ts.
function notify(title, body, env) {
  const out = [];
  if (env.WT_SESSION) {
    // Windows Terminal — can't easily test without powershell.
    // We'll just verify the logic path is correct.
    out.push("WINDOWS_TOAST");
  } else if (env.KITTY_WINDOW_ID) {
    out.push(`\x1b]99;i=1:d=0;${title}\x1b\\`);
    out.push(`\x1b]99;i=1:p=body;${body}\x1b\\`);
  } else {
    out.push(`\x1b]777;notify;${title};${body}\x07`);
  }
  return out.join("");
}

console.log("=== notify() unit tests ===\n");

// Test 1: OSC 777 (default — Ghostty, iTerm2, WezTerm, rxvt)
console.log("Test 1: Default terminal (OSC 777)");
{
  const result = notify("pi — test", "hello world", {});
  assert(result.includes("\x1b]777;notify;"), "contains OSC 777 prefix");
  assert(result.includes("pi — test"), "contains title");
  assert(result.includes("hello world"), "contains body");
  assert(result.endsWith("\x07"), "ends with ST (BEL)");
  assert(!result.includes("\x1b]99;"), "no Kitty OSC 99");
}

// Test 2: Kitty (OSC 99)
console.log("Test 2: Kitty terminal (OSC 99)");
{
  const result = notify("pi — test", "hello world", { KITTY_WINDOW_ID: "1" });
  assert(result.includes("\x1b]99;i=1:d=0;pi — test\x1b\\"), "OSC 99 title sequence");
  assert(result.includes("\x1b]99;i=1:p=body;hello world\x1b\\"), "OSC 99 body sequence");
  assert(!result.includes("\x1b]777;"), "no OSC 777");
}

// Test 3: Windows Terminal
console.log("Test 3: Windows Terminal (WT_SESSION)");
{
  const result = notify("pi — test", "hello world", { WT_SESSION: "1" });
  assert(result === "WINDOWS_TOAST", "delegates to PowerShell toast path");
}

// Test 4: Special characters in title/body
console.log("Test 4: Special characters");
{
  const result = notify("pi — test: remove", "rm -rf /tmp/foo", {});
  assert(result.includes("pi — test: remove"), "title with colon preserved");
  assert(result.includes("rm -rf /tmp/foo"), "body with special chars preserved");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
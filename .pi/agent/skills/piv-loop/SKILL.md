---
name: piv-loop
description: >
  Guided Plan-Implement-Validate (PIV) development loop with test-driven implementation
  and human-in-the-loop review. Use when the user says "piv", "piv loop", "plan implement
  validate", "guided development", "structured development", or "build a feature".
  NOT for: quick one-off changes, bug fixes, or autonomous implementation without planning.
  Requires a project with git initialized.
---

# PIV Loop — Plan · Implement · Validate

A structured development methodology with five phases. You follow this methodology
conversationally — there is no rigid state machine, but each phase has clear entry/exit
criteria and must be completed before the next begins.

## Overview

```
EXPLORE → PLAN → IMPLEMENT → VALIDATE → FINALIZE
  ↑          ↑                  ↑
  └── loop ──┘   └── loop ──────┘
```

1. **EXPLORE** — Iterative conversation to deeply understand what to build
2. **PLAN** — Create a structured implementation plan, iterate until approved
3. **IMPLEMENT** — Test-driven red → green loop, task-by-task from the plan
4. **VALIDATE** — Code review + iterative human feedback and fixes
5. **FINALIZE** — Push, create PR, generate summary

## Setup

Before starting any phase, create the artifacts directory:

```bash
mkdir -p .piv
```

All plan files, progress tracking, and review artifacts go in `.piv/`.
Add `.piv/` to `.gitignore` if it doesn't exist:

```bash
grep -qxF '.piv/' .gitignore 2>/dev/null || echo '.piv/' >> .gitignore
```

Determine the base branch:

```bash
BASE_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}')
BASE_BRANCH=${BASE_BRANCH:-main}
```

Create a feature branch if not already on one:

```bash
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "$BASE_BRANCH" ]; then
    echo "You are on the base branch. Create a feature branch before starting."
    echo "Example: git checkout -b feature/my-feature"
fi
```

## Phase 1: EXPLORE

**Goal**: Deeply understand what to build before any code is written.

**Entry**: User's feature request, bug description, or path to a plan/PRD file.

**Process**:

1. **Parse the input**:
   - Free text → feature idea or bug description
   - File path (`.md`, `.plan.md`) → existing plan or PRD to refine
   - GitHub issue (`#123`) → fetch with `gh issue view {number} --json title,body,labels,comments`

2. **Do your homework**:
   - Read `AGENTS.md` (or `CLAUDE.md`) for project conventions
   - Search for related existing code
   - Read key files the user wants to change
   - Check recent git history: `git log --oneline -20`

3. **Present your understanding**:

   ```
   ## What I Understand

   {restated understanding in 2-3 sentences}

   ## What Already Exists

   - {file:line} — {what it does and how it relates}
   - {pattern/component} — {how it could be extended}

   ## Initial Architecture Thoughts

   Based on what exists:
   - {approach 1 — extend existing X}
   - {approach 2 — alternative}

   ## Testing Seams

   - {seam}: {behavior to verify at this public boundary}
   ```

4. **Ask 4-6 targeted questions** focused on decisions, not information gathering:
   - Scope boundaries, architecture preferences, tech decisions
   - Constraints, extension vs. fresh build
   - Which seams matter most — where should tests verify behavior
   - Reference actual code you found — don't ask generic questions

5. **Loop**: Process user responses, do targeted research, refine understanding.
   Continue until the picture is clear enough to create a plan.

6. **Present the implementation summary**:

   ```
   ## Implementation Summary

   ### What We're Building
   {Clear, specific description}

   ### Scope
   - IN: {what's included}
   - OUT: {what's excluded and why}

   ### Architecture
   - {key decisions}

   ### Files That Will Change
   - `{file}` — {what changes and why}

   ### Success Criteria
   - [ ] {specific, testable criterion — verifiable by a test at a seam}
   - [ ] All validation passes

   ### Key Risks
   - {risk — and mitigation}
   ```

**Exit**: User says "ready", "create the plan", "let's go", or similar.
Do NOT proceed unless the user explicitly signals readiness.

---

## Phase 2: PLAN

**Goal**: Create a structured, test-driven implementation plan. Every task is a vertical
slice: one seam, one test, one minimal implementation.

Read the detailed plan template: [references/plan-template.md](references/plan-template.md)

**Process**:

1. **Re-read the codebase** — verify your understanding is current before writing the plan.
   Read every file you plan to change. Note exact current state.

2. **Write the plan** to `.piv/plan.md` using the template above.
   Every section must be filled with specific, verified information.
   Each task in the plan is a TDD vertical slice: it specifies the seam to test at,
   what the failing test will verify, and the minimal implementation to pass it.

3. **Present the plan summary**:

   ```
   ## Plan Created

   **File**: `.piv/plan.md`
   **Tasks**: {count}
   **Files to change**: {count}

   Key decisions:
   - {decision 1}
   - {decision 2}

   Review the plan and provide feedback, or say "approved" to proceed.
   ```

4. **Iterate on the plan** based on user feedback:
   - Edit `.piv/plan.md` directly with each round of feedback
   - Show what changed after each revision
   - Continue until the user says "approved", "looks good", or "let's go"

**Exit**: User explicitly approves the plan.

---

## Phase 3: IMPLEMENT

**Goal**: Execute the plan using the red → green loop. Every task is a vertical slice:
failing test → minimal implementation → commit. No horizontal slicing.

**Golden Rules**:
- Never commit broken code.
- Refactoring belongs to Phase 4 (VALIDATE), not here. The loop is red → green → commit.
- For test quality guidance (anti-patterns, mocking, what a good test is), read the
  TDD skill: `/home/hsrvms/.pi/agent/skills/tdd/SKILL.md`, with examples in
  `/home/hsrvms/.pi/agent/skills/tdd/tests.md` and mocking at
  `/home/hsrvms/.pi/agent/skills/tdd/mocking.md`.

**Process**:

For each task in the plan (each a vertical slice, identified by `### Task N:` headers):

1. **Announce the task**:

   ```
   -- Task {N} of {total} -----------------------------------------------
   Seam: {public behavior under test}
   Files: {files created or changed}
   ------------------------------------------------------------------------
   ```

2. **RED — Write the failing test**:
   - Write a test at the task's seam that verifies the behavior the plan specifies.
   - Test behavior through public interfaces only — never internal details.
   - Expected values must come from an independent source (known-good literal, spec),
     never recomputed the way the implementation will compute them.
   - Run the test. It must fail for the right reason (missing behavior, not a syntax error).
     If it passes, the test is wrong — fix it before proceeding.

3. **GREEN — Implement minimal code**:
   - Write only enough code to make the failing test pass.
   - Do not anticipate future tasks or add speculative features.
   - Run the test. It must pass. Run the full test suite — no regressions.

4. **Validate**: Run full validation (type check, lint, format, all tests).
   If validation fails: fix and re-run (up to 3 attempts).

5. **Commit**: Stage only the files changed for this task — never `git add -A` or `git add .`.
   List files explicitly:

   ```bash
   git add path/to/file1 path/to/file2
   git commit -m "{type}: {task description}

   PIV Task {N}: {brief details}"
   ```

   Never stage: `.piv/`, `*.scratch.md`, `*.tmp.md`, review files, or temporary artifacts.

6. **Track progress** in `.piv/progress.txt`:

   ```
   ## Task {N}: {title} — COMPLETED
   Date: {ISO date}
   Seam: {what was tested}
   Files: {list}
   Commit: {short hash}
   ---
   ```

7. **After all tasks are done**, run full validation one more time.

**Exit**: All tasks completed and validation passes.

---

## Phase 4: VALIDATE

**Goal**: Automated code review + iterative human feedback.

**Process**:

### 4a: Automated Code Review

1. **Review all changes** against the plan:

   ```bash
   git log --oneline --no-merges $(git merge-base HEAD $BASE_BRANCH)..HEAD
   git diff $BASE_BRANCH..HEAD --stat
   git diff $BASE_BRANCH..HEAD
   ```

2. **Check each task**: was it implemented correctly? Do success criteria hold?

3. **Check each file**: quality, security, patterns, conventions compliance.

4. **Check test quality**:
   - Tests verify behavior at seams, not implementation details
   - No tautological assertions (expected values independent of implementation)
   - No mocked internal collaborators
   - Each test reads like a specification

5. **Run full validation**.

6. **Fix obvious issues** (type errors, lint warnings, missing imports, formatting).
   This is where refactoring happens — the loop in Phase 3 was red → green only.
   Stage only fixed files. Commit if changes were made.

7. **Present the review**:

   ```
   ## Code Review

   ### Implementation Status
   | Task | Status | Notes |
   |------|--------|-------|
   | {N}  | DONE / PARTIAL / MISSING | {notes} |

   ### Validation Results
   - Type check: PASS / FAIL
   - Lint: PASS / FAIL
   - Tests: PASS / FAIL
   - Format: PASS / FAIL

   ### Findings
   {Issues found, or "No issues found."}

   ### Recommendation
   {READY FOR REVIEW / NEEDS FIXES}
   ```

### 4b: Human Feedback Loop

Ask the user to test and review the implementation. Process their feedback:

- If feedback provided → make fixes, re-validate, commit, report changes
- If approved ("looks good", "ship it") → proceed to Finalize

Loop until the user explicitly approves.

**Exit**: User explicitly approves the implementation.

---

## Phase 5: FINALIZE

**Goal**: Push, create PR, generate summary.

**Process**:

1. **Push changes**:

   ```bash
   git push -u origin HEAD
   ```

   Ask the user before pushing. Never push automatically without confirmation.

2. **Generate summary**:

   ```bash
   git log --oneline --no-merges $(git merge-base HEAD $BASE_BRANCH)..HEAD
   git diff --stat $(git merge-base HEAD $BASE_BRANCH)..HEAD
   ```

3. **Create PR** (if `gh` is available and no PR exists):

   ```bash
   gh pr view HEAD --json url 2>/dev/null || gh pr create --draft --base $BASE_BRANCH
   ```

4. **Output final summary**:

   ```
   ===============================================================
   PIV LOOP — COMPLETE
   ===============================================================

   Feature: {from plan}
   Plan: .piv/plan.md
   Branch: {branch name}
   PR: {url or N/A}

   -- Tasks Completed -----------------------------------------------
   {from .piv/progress.txt}

   -- Commits -------------------------------------------------------
   {git log}

   -- Files Changed -------------------------------------------------
   {git diff --stat}

   -- Validation ----------------------------------------------------
   All checks passed.
   ===============================================================
   ```

---

## Git Safety Rules

These rules are non-negotiable throughout all phases:

- **Never** `git add -A`, `git add .`, or `git add -u`
- **Always** list files explicitly when staging
- **Never** push without asking the user first
- **Never** commit files in `.piv/`, scratch files, or temporary artifacts
- **Never** rewrite history (`git rebase -i`, `git reset --hard`) without explicit permission
- **Always** show `git diff --cached --stat` before committing
- **Always** ask before destructive operations

## Adaptive Commands

Detect the project's tooling and use the right commands. Do NOT assume a specific
package manager or build tool. Check for:

| Check file             | Command to use       |
|------------------------|----------------------|
| `go.mod`               | `go build ./...`, `go vet ./...`, `go test ./...` |
| `pyproject.toml` + `uv.lock` | `uv run ruff check`, `uv run pytest`, `uv run pyright` |
| `pyproject.toml`       | `ruff check`, `pytest`, `pyright` |
| `bun.lock` / `bun.lockb` | `bun run type-check`, `bun run lint`, `bun run test` |
| `pnpm-lock.yaml`       | `pnpm run type-check`, `pnpm run lint`, `pnpm run test` |
| `package-lock.json`    | `npm run type-check`, `npm run lint`, `npm run test` |
| `yarn.lock`            | `yarn run type-check`, `yarn run lint`, `yarn run test` |
| `Makefile`             | `make lint`, `make test`, `make check` |

Always verify by reading `package.json` scripts, `Makefile` targets, or equivalent
before running validation commands.

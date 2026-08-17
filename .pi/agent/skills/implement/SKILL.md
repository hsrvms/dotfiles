---
name: implement
user-invocable: true
description: Implement a piece of work based on a spec or set of tickets.
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

## 1. Understand the spec

Read the spec, tickets, or user description. If a `CONTEXT.md` exists, read it for domain vocabulary. Identify every requirement. Ask the user to clarify anything ambiguous before writing code.

**Done when:** you can restate every requirement and the user confirms your understanding.

## 2. Create a branch

Create and check out a new branch named after the spec or ticket (e.g. `feat/<ticket>-<slug>`).

**Done when:** `git branch --show-current` reports the new branch.

## 3. Plan seams

Identify the seams where behaviour will be tested (see the `tdd` skill). Confirm them with the user before any implementation.

**Done when:** user has confirmed the seam list.

## 4. Implement in slices

Work one seam at a time. For each seam, use the `tdd` skill: write the failing test, then the minimal implementation to pass it.

After each slice, run a **tight feedback loop**:

| Check | Go | Python |
|---|---|---|
| Typecheck | `go vet ./...` | `mypy` or `pyright` |
| Test the slice | `go test ./<pkg>/...` | `pytest <test_file>` |

Run both after every slice. Fix failures before the next slice. If the project uses a different toolchain, detect it from the project root (Makefile, pyproject.toml, go.mod, etc.) and use the project's own commands.

**Done when:** every confirmed seam has a passing test and the typecheck is clean.

## 5. Full validation

Run the complete test suite (`go test ./...` or `pytest`) and the full typecheck. Fix any failures.

**Done when:** full suite passes, typecheck is clean, zero failures.

## 6. Review

Run the `code-review` skill against the work done. Address any findings.

**Done when:** review findings are resolved or explicitly acknowledged by the user.

## 7. Commit

Commit the work to the current branch. Show the user a summary of changes before committing.

**Done when:** changes committed, summary presented.

## 8. Ship

Ask the user whether they want to ship the work. If they decline, you are done.

If they accept:
- Push the branch to the remote.
- Open a pull request. If the work traces to an issue, add a closing reference to the PR body (e.g. `Closes #123`) so merging closes it.
- Generate a summary of the delivered work, suitable as the PR description.

**Done when:** the user declined, or the branch is pushed, the PR is open with the issue linked (if any), and the summary is delivered.

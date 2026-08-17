---
name: to-tickets
user-invocable: true
description: Break a plan, spec, or conversation into tracer-bullet tickets — vertical slices each declaring its blockers.
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into **tracer bullet** tickets — vertical slices, each declaring the tickets that **block** it.

## 1. Gather context

Work from whatever is already in the conversation. If the user passes a reference (spec path, issue number or URL), fetch and read its full body and comments.

**Done when:** every source the user pointed at is loaded and understood.

## 2. Explore the codebase

Walk the repo to understand its current state — module structure, seams, test patterns, conventions. Read `CONTEXT.md` (if it exists) for domain vocabulary and ADRs in the area being touched. Use the `/codebase-design` vocabulary (**module**, **interface**, **seam**, **depth**) throughout.

Look for opportunities to prefactor: "make the change easy, then make the easy change."

Skip if the codebase is already in context.

**Done when:** you can name the modules and interfaces affected, in the project's own language.

## 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

Each slice:

- Cuts a narrow but **complete** path through every layer touched (schema, API, UI, tests) — vertical, not a horizontal layer slice
- Is demoable or verifiable on its own when done
- Fits in a single fresh context window
- Starts with any prefactoring it needs

Give each ticket its **blocking edges** — the tickets that must complete before it can start. No blockers means it can start immediately.

For mechanical changes with wide **blast radius** (rename a column, retype a shared symbol), read [WIDE-REFACTOR.md](WIDE-REFACTOR.md).

**Done when:** every ticket has a title, a clear deliverable, and its blocking edges declared.

## 4. Quiz the user

Present the breakdown as a numbered list. For each ticket show:

- **Title** — short descriptive name
- **Blocked by** — which other tickets must complete first
- **Delivers** — the end-to-end behaviour this ticket makes work

Ask:

- Granularity right? (too coarse / too fine)
- Blocking edges correct?
- Any tickets to merge or split?

Iterate until approved.

**Done when:** user confirms the breakdown.

## 5. Publish tickets

Publish in dependency order (blockers first). Work the **frontier**: any ticket whose blockers are all done.

**Discover the tracker** from the git remote:

| Remote | Method |
|---|---|
| GitHub | `gh issue create --title "..." --body-file <file> --label "ready-for-agent"` |
| GitLab | `glab issue create --title "..." --description "$(cat <file>)" --label "ready-for-agent"` |
| Other / unknown / CLI unavailable | Write one file per ticket under `.scratch/<feature-slug>/issues/` |

### Issue tracker

Publish one issue per ticket. Use the platform's native blocking or sub-issue relationship where available; otherwise list blocking issues by number in the body. Apply the `ready-for-agent` label unless instructed otherwise.

### Local files

Number files from `01` in dependency order. Each file's "Blocked by" lists the numbers/titles it depends on. Use the template below — one ticket per file.

### Ticket template (local files)

```markdown
# <NN> — <Title>

**Delivers:** the end-to-end behaviour this ticket makes work, from the user's perspective.

**Blocked by:** numbers/titles of gating tickets, or "None — can start immediately".

**Status:** ready-for-agent

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2
```

### Both forms

Use domain glossary vocabulary from `CONTEXT.md`, not implementation terms. Avoid specific file paths or code snippets — they go stale. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose (state machine, reducer, schema, type shape), inline the decision-rich parts only.

**Done when:** every approved ticket is published (tracker or local files) and the user has links or paths.

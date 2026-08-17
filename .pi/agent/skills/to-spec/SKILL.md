---
name: to-spec
user-invocable: true
description: Turn the current conversation into a spec and publish it to the project issue tracker — no interview, just synthesis of what you've already discussed.
disable-model-invocation: true
---

# To Spec

**Synthesize** the current conversation and codebase understanding into a spec. Do not interview the user — distill what you already know.

Read `CONTEXT.md` for domain vocabulary and any ADRs in the area being touched.

## 1. Explore the codebase

Walk the repo to understand its current state — module structure, existing seams, test patterns, and conventions. Use the `/codebase-design` vocabulary (**module**, **interface**, **seam**, **depth**) throughout.

**Done when:** you can describe the relevant modules and their interfaces in the codebase's own language.

## 2. Sketch seams

Identify the seams at which the feature will be tested. Use the `/tdd` skill's seam discipline:

- Prefer existing seams over new ones.
- Place seams at the highest point possible.
- Fewer seams across the codebase is better — the ideal number is one.

**Done when:** user has confirmed the seam list.

## 3. Write and publish the spec

Load the spec template from [SPEC-TEMPLATE.md](SPEC-TEMPLATE.md) and fill in every section. Use the project's domain glossary vocabulary throughout — domain terms from `CONTEXT.md`, not implementation terms.

**Implementation Decisions** — name modules and interfaces, not file paths or code snippets. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose (state machine, reducer, schema, type shape), inline the decision-rich parts.

**Discover the issue tracker** from the git remote:

| Remote | Command |
|---|---|
| GitHub | `gh issue create --title "..." --body-file <spec-file> --label "ready-for-agent"` |
| GitLab | `glab issue create --title "..." --description "$(cat <spec-file>)" --label "ready-for-agent"` |
| Other / unknown | Write the spec to a local file (`specs/<timestamp>-<slug>.md`) and present the path to the user |

If the CLI tool isn't available or the command fails, fall back to the local file approach and tell the user.

**Done when:** spec published to the tracker (or written to a local file) and the user has the link or path.

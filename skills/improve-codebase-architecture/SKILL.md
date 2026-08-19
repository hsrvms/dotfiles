---
name: improve-codebase-architecture
description: Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
disable-model-invocation: true
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening** opportunities — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

Load the `codebase-design` skill first for the architecture vocabulary (**module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**). Use these terms exactly in every suggestion — never substitute "component," "service," "API," or "boundary."

Read `CONTEXT.md` for domain language and any ADRs in `docs/adr/` before scanning.

## 1. Explore

**Scope before you scan.** Deepening pays off where future changes are likely, so weight attention toward recently-changed areas.

- If the user named a target — a module, subsystem, or pain point — go there directly.
- Otherwise, scan `git log --oneline` for **hot spots** — files and areas that keep appearing in recent commits.

Walk the codebase looking for friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where do tightly-coupled modules leak across their seams?
- Which parts are untested or hard to test through their current interface?

Apply the **deletion test** to anything suspicious: would deleting it concentrate complexity, or just move it?

**Done when:** you have 2–5 candidate deepenings, each with a clear problem statement and before/after shape in mind.

## 2. Present candidates as an HTML report

Write a self-contained HTML file to the OS temp directory (`$TMPDIR` or `/tmp`). Name it `architecture-review-<timestamp>.html`. Open it for the user (`xdg-open` on Linux, `open` on macOS, `start` on Windows) and tell them the absolute path.

See [HTML-REPORT.md](HTML-REPORT.md) for the full scaffold, diagram patterns, and styling guidance.

Each candidate card contains:

- **Files** — which files/modules are involved
- **Problem** — one sentence on what hurts
- **Solution** — one sentence on what changes
- **Wins** — bullets naming the gain in glossary terms (locality, leverage, depth)
- **Before / After diagram** — side-by-side visualisation of the shallowness and the deepening
- **Recommendation strength** — `Strong`, `Worth exploring`, or `Speculative`

End with a **Top recommendation**: which candidate to tackle first and why.

If a candidate contradicts an existing ADR, mark it with a warning callout only when the friction justifies revisiting the ADR.

Do not propose interfaces yet. After the report opens, ask: "Which of these would you like to explore?"

**Done when:** the report is open and the user has picked a candidate.

## 3. Grilling loop

Run the `grill-me` skill on the chosen candidate — stress-test the deepening decision: constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Side effects happen inline as decisions crystallise — run the `domain-modeling` skill to keep the domain model current:

- **Naming a deepened module after a concept not in `CONTEXT.md`?** Add it immediately.
- **Sharpening a fuzzy term?** Update `CONTEXT.md` right there.
- **User rejects the candidate with a load-bearing reason?** Offer an ADR: _"Want me to record this so future reviews don't re-suggest it?"_ Only when a future explorer would need the context — skip ephemeral reasons.
- **Exploring alternative interfaces?** Run the `codebase-design` skill's design-it-twice pattern.

**Done when:** the grilling reaches a shared understanding and the user confirms the deepening direction.

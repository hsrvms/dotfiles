---
name: grill-with-docs
user-invocable: true
description: A relentless interview to sharpen a plan or design, which also creates docs (ADRs and glossary) as we go.
disable-model-invocation: true
---

# Grill With Docs

You are running a **grilling** session — the full process from `grill-me` — and simultaneously
acting as a **domain modeler** per `domain-modeling`. The two disciplines feed each other:
the grilling surfaces terms and decisions, and the modeling captures them before they slip away.

## Process

### Phase 1: Setup

If no `CONTEXT.md` exists at the project root, note that one will be created when the first
term is resolved. If no `docs/adr/` exists, note that it will be created when the first ADR
is needed.

Ask the user to describe their plan, design, or idea. If they have already described it
in the conversation, proceed directly to Phase 2.

### Phase 2: Grill and capture

Run the full `grill-me` process — summarize, then three rounds of questioning, then synthesis.
But with one addition: **capture documentation as you go.**

After each round of questioning (and after the synthesis), pause and check:

- **Glossary terms.** Did any term get defined or sharpened during that round? If so, update
  `CONTEXT.md` immediately. Use the format: `**Term:** definition.`
- **ADR candidates.** Did any decision surface that is hard to reverse, surprising without
  context, and the result of a real trade-off? If so, flag it to the user and offer to create
  an ADR in `docs/adr/NNNN-slug.md`.

When the user's answer crystallizes a term, capture it inline — don't batch. When the user
makes a decision that meets the ADR bar, offer the ADR before moving to the next question.

### Phase 3: Final documentation pass

After the grilling synthesis, do a final sweep:

1. Re-read `CONTEXT.md` — are there terms from the session that weren't captured?
2. Re-read the flagged ADR candidates — any that the user accepted but weren't created?
3. Report what was created:
   ```
   ## Docs Created
   - `CONTEXT.md` — {N} terms added/updated
   - `docs/adr/0001-slug.md` — {title}
   - ...
   ```

## ADR and glossary formats

Use the formats from `domain-modeling`:
- Glossary: `**Term:** definition.` in `CONTEXT.md`. No implementation details.
- ADR: `# {Title}\n\n{1-3 sentences: context, decision, why.}` in `docs/adr/NNNN-slug.md`.

## Guardrails

- **Don't force ADRs.** Only offer when all three criteria are met (hard to reverse,
  surprising without context, result of a real trade-off). A grilling session surfaces many
  decisions; most don't need ADRs.
- **Keep the glossary clean.** `CONTEXT.md` is a glossary, not a spec or scratch pad.
  No implementation details.
- **Grill first, document second.** The grilling is the engine — documentation is the exhaust.
  Don't let documentation slow the questioning.

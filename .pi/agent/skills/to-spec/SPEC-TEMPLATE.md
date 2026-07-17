# Spec Template

Fill in every section. Use domain glossary terms from `CONTEXT.md`, not implementation jargon.

## Problem Statement

The problem the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

An extensive numbered list of user stories. Format:

```
1. As an <actor>, I want a <feature>, so that <benefit>
```

Cover all aspects of the feature — edge cases, error paths, and variations. This list should be thorough, not minimal.

## Implementation Decisions

A list of decisions made during design. Include:

- Modules that will be built or modified
- Interfaces of those modules
- Technical clarifications
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do not include file paths or code snippets — they go stale. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose (state machine, reducer, schema, type shape), inline it within the relevant decision and note it came from a prototype. Trim to the decision-rich parts.

## Testing Decisions

A list of testing decisions. Include:

- What makes a good test (external behaviour only, not implementation details)
- Which modules will be tested and at which seams
- Prior art for the tests (similar test patterns already in the codebase)

## Out of Scope

Things explicitly excluded from this spec.

## Further Notes

Anything else relevant — open questions, risks, dependencies on other teams or systems.

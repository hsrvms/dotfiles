# Plan Template

Copy this template to `.piv/plan.md` and fill every section with specific, verified information.
Do NOT leave placeholder text. Every file path must exist. Every pattern cited must be verified.

---

```markdown
# Feature: {Title}

## Summary

{1-2 sentences: what changes and why}

## Mission

{The core goal in one clear statement}

## Success Criteria

- [ ] {Specific, testable criterion}
- [ ] {Specific, testable criterion}
- [ ] All validation passes
- [ ] No regressions in existing tests

## Scope

### In Scope

- {What we ARE building}

### Out of Scope

- {What we are NOT building — and why}

## Codebase Context

### Key Files

| File | Role | Action |
|------|------|--------|
| `{path}` | {what it does} | CREATE / UPDATE |

### Existing Patterns to Follow

{Actual code snippets from the codebase that the implementation should mirror.
Include file paths and line numbers.}

```language
// From: {file}:{lines}
{code snippet}
```

## Architecture

- **{Decision 1}**: {Rationale}
- **{Decision 2}**: {Rationale}

## Task List

Execute in order. Each task is atomic and independently verifiable.

### Task 1: {ACTION} `{file path}`

**Action**: CREATE / UPDATE
**Details**: {Exact changes — specific enough for an agent with no context}
**Pattern**: Follow `{source file}:{lines}`
**Validate**: `{command to verify this task}`

### Task 2: {ACTION} `{file path}`

**Action**: CREATE / UPDATE
**Details**: {Exact changes}
**Pattern**: Follow `{source file}:{lines}`
**Validate**: `{command to verify this task}`

## Testing Strategy

| Test File | Test Cases | Validates |
|-----------|-----------|-----------|
| `{path}` | {cases} | {what it validates} |

## Validation Commands

1. Type check: `{command}`
2. Lint: `{command}`
3. Tests: `{command}`
4. Full validation: `{command}`

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| {risk} | HIGH / MED / LOW | {specific mitigation} |
```

---

## Guidelines

### Task Granularity

Each task should be small enough to:
- Implement in one focused session
- Validate independently
- Commit as a single logical unit

If a task requires changing more than 3-4 files, split it.

### Task Ordering

Respect dependencies:
- Types/models before handlers
- Repository before service
- Service before handler
- Tests alongside (not after) the code they test

### Details Section

The Details section must be specific enough that an agent with NO prior context
could implement it correctly. Include:
- Exact function signatures
- Field names and types
- Error handling behavior
- Edge cases to handle

Bad:
```
Add a function to handle user creation.
```

Good:
```
Add `CreateUser(ctx context.Context, req CreateUserRequest) (*User, error)` that:
1. Validates req.Email is non-empty and matches email regex
2. Checks repository for existing user with same email (return ErrUserExists if found)
3. Hashes password with bcrypt (cost 12)
4. Calls repository.Create with the new user
5. Returns the created user with generated ID and timestamps
```

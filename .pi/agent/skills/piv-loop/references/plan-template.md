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

- [ ] {Specific, testable criterion — verifiable by a test at a seam}
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

## Seam Map

Every task is a vertical slice at a seam. List all seams here, then cover each in a task below.

| Seam | Behavior Tested | Covered By Task |
|------|-----------------|-----------------|
| `{interface or public function}` | {what it does} | Task {N} |

## Task List

Execute in order. Each task is a TDD vertical slice: one seam, one failing test, one minimal
implementation. Tasks are ordered by dependency (types/models → repository → service → handler).

### Task 1: {brief title}

**Seam**: {public interface or behavior being tested}
**Test**: {what the test verifies — specific assertion, independent expected value}
**Implementation**: {minimal code to pass — specific enough to implement without guessing}
**Files**:
- `{path}` — CREATE / UPDATE
**Pattern**: Follow `{source file}:{lines}`
**Validate**: `{command to verify this task}`

### Task 2: {brief title}

**Seam**: {public interface or behavior being tested}
**Test**: {what the test verifies}
**Implementation**: {minimal code to pass}
**Files**:
- `{path}` — CREATE / UPDATE
**Pattern**: Follow `{source file}:{lines}`
**Validate**: `{command to verify this task}`

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
- Write a failing test, implement, and validate in one focused session
- Commit as a single logical unit

If a task requires changing more than 3-4 files, split it.

### Task Ordering

Respect dependencies — types/models → repository → service → handler.
Each task is a complete vertical slice (test + implementation), so a task can be run,
tested, and committed independently of tasks below it.

### Task Specificity

Each task's **Test** and **Implementation** fields must be specific enough that an agent
with NO prior context could write the test and implement the code correctly. Include:
- Exact function signatures and field names
- The specific assertion and its independent expected value
- Error handling behavior and edge cases

Bad:
```
**Test**: Test user creation
**Implementation**: Add a function to handle user creation.
```

Good:
```
**Seam**: `CreateUser(ctx, req) (*User, error)`
**Test**: CreateUser with valid inputs returns a User with generated ID and timestamps;
       CreateUser with duplicate email returns ErrUserExists.
       Expected values: name="Alice", status=Active (independent literals).
**Implementation**:
1. Validate req.Email is non-empty and matches email regex
2. Check repository for existing user with same email (return ErrUserExists if found)
3. Hash password with bcrypt (cost 12)
4. Call repository.Create with the new user
5. Return the created user with generated ID and timestamps
```

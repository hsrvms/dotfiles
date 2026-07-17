# Global Engineering Rules

These rules apply to every project unless explicitly overridden by the repository.

---

# Core Principles

- Produce production-ready code.
- Prioritize correctness over cleverness.
- Prefer readability over brevity.
- Keep implementations simple.
- Eliminate duplication.
- Minimize unnecessary abstractions.
- Choose maintainability over premature optimization.
- Never leave placeholder implementations or TODOs unless explicitly requested.

---

# Architecture

## Modular Design

Organize code by feature or domain rather than by technical layer.

Prefer:

```
users/
    handler
    service
    repository
    model

orders/
    handler
    service
    repository
    model
```

Avoid:

```
handlers/
repositories/
services/
models/
```

Each module should own its:

- business logic
- persistence
- API handlers
- validation
- tests

Modules should communicate through well-defined interfaces.

Keep coupling low and cohesion high.

---

## Separation of Concerns

Separate:

- domain logic
- infrastructure
- configuration
- transport
- persistence

Business logic must not depend directly on infrastructure.

Infrastructure should be replaceable.

---

## Dependencies

Prefer:

Application

↓

Domain

↓

Infrastructure

Never allow infrastructure concerns to leak into domain logic.

---

# Code Quality

- Write self-documenting code.
- Prefer explicit behavior.
- Keep functions focused on a single responsibility.
- Prefer small modules.
- Keep nesting shallow.
- Prefer early returns.
- Avoid global mutable state.
- Avoid hidden side effects.
- Remove dead code.
- Avoid unnecessary comments.
- Explain why, not what.

---

# API Design

- Validate inputs at system boundaries.
- Return consistent error responses.
- Use meaningful names.
- Design stable interfaces.
- Minimize breaking changes.

---

# Error Handling

- Fail fast.
- Never silently ignore errors.
- Include useful context.
- Use specific error types.
- Never suppress exceptions or errors without justification.

---

# Testing

Every feature requires appropriate testing.

Prefer:

- unit tests
- integration tests

Tests should:

- be deterministic
- avoid shared state
- avoid timing dependencies
- cover edge cases
- cover failure cases

Prefer real integrations over excessive mocking.

Mock only external systems or expensive dependencies.

---

# Performance

Optimize only after measuring.

Prefer:

- straightforward implementations
- predictable algorithms
- efficient data structures

Avoid premature optimization.

---

# Security

Never:

- expose secrets
- disable TLS verification
- trust external input
- construct SQL dynamically
- disable authentication

Always:

- validate input
- sanitize output
- use parameterized queries
- follow least-privilege principles

---

# Configuration

Configuration should:

- come from environment variables or configuration files
- be validated during startup
- fail fast when invalid

Never hardcode credentials.

---

# Logging

Use structured logging.

Never log:

- passwords
- tokens
- secrets
- sensitive personal information

Include sufficient context for troubleshooting.

---

# Documentation

Public APIs should be documented.

Document:

- assumptions
- architectural decisions
- non-obvious behavior

Keep documentation synchronized with implementation.

---

# Dependencies

Before adding a dependency:

- Prefer the standard library.
- Evaluate maintenance.
- Evaluate security.
- Evaluate community adoption.
- Minimize transitive dependencies.

Remove unused dependencies.

---

# Git

Never:

- commit automatically
- push automatically
- rewrite history automatically

Always:

- show proposed changes
- summarize significant modifications
- ask before destructive Git operations

---

# Assistant Behavior

When implementing changes:

1. Understand the existing architecture before modifying it.
2. Match existing project conventions unless instructed otherwise.
3. Keep changes localized.
4. Do not perform unrelated refactoring.
5. Do not introduce new dependencies without justification.
6. Explain important design decisions.
7. Identify trade-offs when multiple solutions exist.

Before declaring a task complete:

- Run the project's formatter.
- Run the project's linter.
- Run static analysis.
- Run type checking if applicable.
- Run affected unit tests.
- Run integration tests when affected.
- Explain any failing checks.
- Never claim success if checks have not passed.

---

# Communication

Assume the reader is an experienced software engineer.

Provide:

- concise explanations
- technical reasoning
- trade-offs
- risks

Avoid:

- unnecessary repetition
- filler
- speculative claims

State assumptions explicitly when information is incomplete.

---

# Decision Hierarchy

When multiple valid solutions exist, prefer the one that is:

1. Simpler.
2. Easier to maintain.
3. More explicit.
4. More testable.
5. More modular.
6. More secure.
7. Better aligned with the existing codebase.

Do not introduce patterns or abstractions until there is a demonstrated need.

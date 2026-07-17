# Python Project Conventions

These rules apply to this Python project. They supplement the global engineering rules in `~/.pi/agent/AGENTS.md`.

---

## Language & Runtime

- Target **Python 3.11+**.
- Use modern Python features: `match` statements, `type` aliases, `Self`, `Never`, `Unpack`, `ExceptionGroup`, task groups, and `tomllib`.
- Avoid backports unless explicitly required for compatibility.

---

## Toolchain

| Tool       | Role                        |
|------------|-----------------------------|
| `uv`       | Package & environment manager |
| `pyright`  | Static type checker (strict) |
| `ruff`     | Linter, formatter, import sorter |
| `pytest`   | Test runner                  |

All tool configuration lives in `pyproject.toml`. No separate config files (`.flake8`, `mypy.ini`, etc.).

---

## pyproject.toml

```toml
[project]
name = "project-name"
version = "0.1.0"
description = ""
requires-python = ">=3.11"
dependencies = []

[dependency-groups]
dev = [
    "pyright",
    "ruff",
    "pytest",
    "pytest-asyncio",
    "pytest-cov",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

# ── Pyright ──────────────────────────────────────────────
[tool.pyright]
pythonVersion = "3.11"
typeCheckingMode = "strict"
reportMissingTypeStubs = false
reportUnknownMemberType = false
reportUnknownVariableType = false
reportUnknownArgumentType = false

# ── Ruff ─────────────────────────────────────────────────
[tool.ruff]
target-version = "py311"
line-length = 88
fix = true

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort
    "N",    # pep8-naming
    "UP",   # pyupgrade
    "B",    # flake8-bugbear
    "A",    # flake8-builtins
    "C4",   # flake8-comprehensions
    "SIM",  # flake8-simplify
    "TCH",  # flake8-type-checking
    "RUF",  # ruff-specific rules
    "ASYNC", # flake8-async
    "PT",   # flake8-pytest-style
]
ignore = [
    "E501",  # line length handled by formatter
]

[tool.ruff.lint.isort]
known-first-party = ["project-name"]

[tool.ruff.lint.flake8-type-checking]
strict = true

# ── Pytest ───────────────────────────────────────────────
[tool.pytest.ini_options]
asyncio_mode = "auto"
addopts = [
    "--strict-markers",
    "--tb=short",
    "-ra",
]
```

### Pyright strict mode notes

The `typeCheckingMode = "strict"` setting enables all strict checks. The `reportUnknown*` overrides reduce noise from third-party libraries that lack type stubs. If a library ships stubs, install them (e.g., `types-requests`). Only add `# type: ignore` with a comment explaining why.

---

## Type Annotations

- **Every** public function, method, parameter, return value, and class attribute must have a type annotation.
- Prefer `X | None` over `Optional[X]`.
- Use `Self` for methods returning the same class.
- Use `type` aliases for complex or reused types: `type UserID = int`.
- Use `Annotated` to attach metadata without changing the runtime type.
- Use `Protocol` over ABCs where possible.
- Prefer `TypedDict` over `dict[str, Any]` for structured data.
- Avoid `Any` except at serialization boundaries. Document every use with a comment.

```python
# Good
def get_user(user_id: int) -> User | None: ...

# Good
type Coordinate = tuple[float, float]

# Good
from typing import Protocol

class Repository(Protocol):
    def find(self, id: int) -> Entity | None: ...

# Avoid
def process(data: dict) -> dict: ...  # too vague
```

---

## Imports

Sorted automatically by `ruff check --fix`. The order is:

1. Standard library
2. Third-party
3. First-party (project-local)
4. Relative (within the same module)

Each group is separated by a blank line. Never use wildcard imports (`from x import *`).

Run:

```bash
uv run ruff check --fix   # fixes import order and other auto-fixable issues
uv run ruff format        # formats code
```

---

## Docstrings

Use **Google style**. Keep them concise. Document the *why* and *contract*, not the implementation.

```python
def connect(timeout: float = 5.0) -> Connection:
    """Establish a connection to the remote service.

    Args:
        timeout: Maximum seconds to wait for the handshake.

    Returns:
        An open connection ready for requests.

    Raises:
        ConnectionError: If the remote service is unreachable.
    """
```

Rules:

- All public modules, classes, functions, and methods require a docstring.
- Private helpers (`_internal`) need docstrings only when behavior is non-obvious.
- Use `Args:`, `Returns:`, `Raises:`, `Attributes:`, `Yields:` sections as needed.
- Omit `Returns:` for functions that always return `None`.
- Use `Examples:` for non-trivial public APIs.

---

## Async

Use `asyncio` as the async runtime.

- Mark async functions with `async def`.
- Use `asyncio.TaskGroup` (Python 3.11+) for concurrent work instead of `gather`.
- Never block the event loop. Offload CPU-bound or blocking I/O work with `asyncio.to_thread`.
- Use `asyncio.Lock` / `asyncio.Event` for synchronization, not threading primitives.
- Prefer `async for` and `async with` over callback-based APIs.
- `pytest-asyncio` with `asyncio_mode = "auto"` handles async test detection.

```python
async def fetch_all(urls: list[str]) -> list[Response]:
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch(url)) for url in urls]
    return [t.result() for t in tasks]
```

---

## Testing

Use `pytest` with `pytest-asyncio`.

- One test file per module: `src/foo/bar.py` → `tests/foo/test_bar.py`.
- Test names describe behavior: `test_returns_none_when_user_not_found`, not `test_get_user_1`.
- Use fixtures for shared setup. Prefer `conftest.py` at the `tests/` root for cross-cutting fixtures.
- Use `pytest.raises` with `match=` to assert specific error messages.
- Use `pytest.mark.parametrize` for data-driven tests.
- Prefer real dependencies in tests. Mock only external services, network calls, or expensive operations.
- Aim for behavioral coverage, not line coverage.

```python
import pytest

def test_parse_rejects_empty_input():
    with pytest.raises(ValueError, match="input must not be empty"):
        parse("")

async def test_fetch_retries_on_timeout(mocker):
    mocker.patch("httpx.AsyncClient.get", side_effect=TimeoutError)
    result = await fetch_with_retry("http://example.com", retries=3)
    assert result is None
```

Run tests:

```bash
uv run pytest                        # all tests
uv run pytest tests/test_auth.py     # specific file
uv run pytest -k "test_login"        # by name pattern
uv run pytest --cov=src              # with coverage
```

---

## Project Structure

```
project-root/
    pyproject.toml
    README.md
    src/
        project_name/
            __init__.py
            ...modules by domain...
    tests/
        conftest.py
        ...mirrors src/ structure...
```

- Use `src/` layout to prevent accidental imports from the project root.
- Keep `tests/` outside `src/`.
- Group by domain, not by technical layer (see global architecture rules).

---

## Common Commands

```bash
# Install dependencies
uv sync

# Add a dependency
uv add httpx

# Add a dev dependency
uv add --dev pytest-mock

# Run the project
uv run python -m project_name

# Type check
uv run pyright

# Lint & auto-fix
uv run ruff check --fix

# Format
uv run ruff format

# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=src --cov-report=term-missing
```

---

## Before Completing a Task

Run all of these and ensure they pass:

```bash
uv run pyright
uv run ruff check
uv run ruff format --check
uv run pytest
```

Do not report a task as complete if any of these fail. If a failure is unrelated to your changes, explain it explicitly.

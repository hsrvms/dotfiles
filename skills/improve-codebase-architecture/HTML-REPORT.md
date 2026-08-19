# HTML Report Format

Single self-contained HTML file in the OS temp directory. Tailwind and Mermaid from CDNs. Mermaid handles graph-shaped diagrams; hand-built divs and inline SVG handle editorial visuals (mass diagrams, cross-sections). Mix the two.

## Scaffold

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Architecture review — {{repo name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## Header

Repo name, date, and a compact legend: solid box = module, dashed line = seam, red arrow = leakage, thick dark box = deep module. No introduction paragraph.

## Candidate card

Diagrams carry the weight. Prose is sparse and uses glossary terms from the `codebase-design` skill.

Each candidate is one `<article>`:

- **Title** — short, names the deepening (e.g. "Collapse the order intake pipeline").
- **Badge row** — recommendation strength (`Strong` = emerald, `Worth exploring` = amber, `Speculative` = slate).
- **Files** — monospaced list, `font-mono text-sm`.
- **Before / After diagram** — the centrepiece. Two columns side by side.
- **Problem** — one sentence.
- **Solution** — one sentence.
- **Wins** — bullets, ≤6 words each. E.g. "Tests hit one interface", "Pricing logic stops leaking", "Delete 4 shallow wrappers".
- **ADR callout** (if applicable) — one line in an amber-tinted box.

If the diagram needs a paragraph to be understood, redraw the diagram.

## Diagram patterns

Pick the pattern that fits. Mix them — variety is the point.

### Mermaid graph — dependencies and call flow

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[Handler] --> B[Validator]
      B --> C[Repo]
      C -.leak.-> D[Client]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

Use `flowchart` or `graph` when the point is "X calls Y calls Z, and look at the mess." Style with `classDef` to colour leakage red and the deep module dark. Sequence diagrams work well for "before: 6 round-trips; after: 1."

### Hand-built boxes-and-arrows — when Mermaid's layout fights you

Modules as `<div>`s with borders. Arrows as inline SVG `<line>` or `<path>` positioned absolutely. Reach for this when the "after" should feel like one thick-bordered deep module with greyed-out internals.

### Cross-section — layered shallowness

Stack horizontal bands (`h-12 border-l-4`) to show layers a call passes through. Before: many thin layers each doing nothing. After: one thick band with the consolidated responsibility.

### Mass diagram — interface as wide as implementation

Two rectangles per module — interface surface area and implementation area. Before: interface nearly as tall as implementation (shallow). After: interface short, implementation tall (deep).

### Call-graph collapse

Before: a tree of function calls as nested boxes. After: collapsed into one box, internal calls shown faded inside.

## Style guidance

- Lean editorial, not corporate-dashboard. Generous whitespace.
- Colour sparingly: one accent (emerald or indigo) plus red for leakage and amber for warnings.
- Keep diagrams ~320px tall so before/after fits side by side without scrolling.
- Use `text-xs uppercase tracking-wider` for module labels inside diagrams.
- Only scripts are Tailwind CDN and Mermaid ESM import. No app code.

## Top recommendation section

One larger card. Candidate name, one sentence on why, anchor link to its card.

## Tone

Plain English, concise — but the architectural nouns and verbs come from the `codebase-design` skill.

**Use exactly:** module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality.

**Never substitute:** component, service, unit (for module) · API, signature (for interface) · boundary (for seam).

**Wins bullets** name the gain in glossary terms: *"locality: bugs concentrate in one module"*, *"leverage: one interface, N call sites"*, *"interface shrinks; implementation absorbs the wrappers"*. Never write *"easier to maintain"* or *"cleaner code"*.

No hedging, no throat-clearing. If a sentence could be a bullet, make it a bullet. If a bullet could be cut, cut it.

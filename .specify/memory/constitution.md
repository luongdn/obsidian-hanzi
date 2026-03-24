<!--
Sync Impact Report
==================
Version change: 0.0.0 → 1.0.0 (initial ratification)
Modified principles: N/A (first version)
Added sections:
  - Principle I: Code Quality First
  - Principle II: Testing Standards
  - Principle III: User Experience Consistency
  - Principle IV: Performance Requirements
  - Section: Performance Standards
  - Section: Development Workflow
  - Section: Governance
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (Constitution Check section already generic)
  - .specify/templates/spec-template.md ✅ (no changes needed)
  - .specify/templates/tasks-template.md ✅ (no changes needed)
Follow-up TODOs: None
-->

# Obsidian Hanzi Constitution

## Core Principles

### I. Code Quality First

All code MUST be clean, readable, and maintainable:

- Every module MUST have a single, clear responsibility
- Functions MUST be small and focused — no function exceeds 50 lines
  of logic without justification
- No dead code, commented-out blocks, or unused imports in committed
  code
- All public interfaces MUST be self-documenting through clear naming;
  comments are reserved for non-obvious "why" explanations only
- Code duplication MUST be eliminated when the same logic appears in
  three or more locations; below that threshold, prefer clarity over
  abstraction
- Linting and formatting MUST pass with zero warnings before any
  merge; the project enforces a single shared configuration

**Rationale**: An Obsidian plugin lives in a user's vault process.
Sloppy code risks crashes, memory leaks, and eroded user trust.
Quality is not optional — it is the baseline.

### II. Testing Standards

All features MUST be verified through appropriate testing:

- Unit tests MUST cover every public function that contains
  conditional logic or data transformation
- Integration tests MUST verify that the dictionary parser, lookup
  engine, and popup renderer work together correctly
- Edge-case tests MUST exist for: missing dictionary file, corrupted
  entries, non-CJK input, empty selections, and boundary characters
- Test names MUST describe the scenario and expected outcome
  (e.g., `lookupSimplifiedChar_returnsTraditionalAndPinyin`)
- Tests MUST run offline with no network dependencies
- All tests MUST pass before a pull request can be merged

**Rationale**: The plugin processes a large dictionary and interacts
with Obsidian's editor API. Untested paths surface as silent failures
or incorrect translations that undermine user confidence.

### III. User Experience Consistency

The plugin MUST feel native to Obsidian at all times:

- Popup styling MUST inherit the active Obsidian theme's CSS
  variables (colors, fonts, border-radius, shadows)
- Interactive elements MUST follow Obsidian's existing tooltip and
  popover patterns for positioning, animation, and dismissal
- Settings UI MUST use Obsidian's built-in Setting components and
  match the look-and-feel of core plugin settings
- State changes (mode switch, field toggles) MUST take effect on the
  next lookup without requiring a restart
- Error states MUST use Obsidian's Notice API — no custom alert
  dialogs or console-only errors
- The plugin MUST NOT alter the user's note content, cursor position,
  or editor state beyond the temporary highlight during lookup

**Rationale**: Users choose Obsidian for its cohesive experience.
A plugin that looks or behaves differently breaks immersion and
reduces adoption.

### IV. Performance Requirements

The plugin MUST be fast and resource-efficient:

- Dictionary parsing and indexing MUST complete within 2 seconds of
  plugin load on a modern desktop
- Individual character/word lookups MUST return results within 200
  milliseconds
- Memory footprint of the loaded dictionary index MUST remain under
  50 MB
- The plugin MUST NOT block the Obsidian main thread during
  dictionary loading; loading MUST be asynchronous
- Popup rendering MUST NOT cause visible jank or layout shift in the
  editor
- The plugin MUST NOT increase Obsidian's startup time by more than
  3 seconds on first load

**Rationale**: Obsidian users expect instant responsiveness. A slow
dictionary lookup or a laggy popup defeats the purpose of an inline
reference tool.

## Performance Standards

Quantitative gates that MUST be met before release:

| Metric                        | Target        | Measurement Method          |
| ----------------------------- | ------------- | --------------------------- |
| Dictionary load time          | < 2 s         | Console timer on plugin load |
| Single lookup latency         | < 200 ms      | Timestamp diff on hover      |
| Dictionary index memory       | < 50 MB       | Heap snapshot after load     |
| Startup overhead              | < 3 s added   | Obsidian boot with/without   |
| Popup render time             | < 100 ms      | Performance mark in render   |

Any regression beyond these targets MUST be treated as a blocking
defect.

## Development Workflow

Rules governing how code moves from idea to merge:

1. **Branch per feature/fix**: All work MUST happen on a named branch
   created via the Specify workflow — never commit directly to main
2. **Lint before commit**: `npm run lint` and `npm run typecheck` MUST
   pass locally before pushing
3. **Review checklist**: Every pull request MUST confirm:
   - Constitution principles are not violated
   - New or changed behavior has corresponding tests
   - Performance targets are not regressed
   - Popup appearance is verified against at least one light and one
     dark Obsidian theme
4. **Incremental delivery**: Features MUST be deliverable per user
   story — each story is independently testable and mergeable
5. **No silent failures**: All caught exceptions MUST surface through
   Obsidian's Notice API or structured logging — never swallow errors

## Governance

This constitution is the highest-authority document for technical
decisions in the Obsidian Hanzi project. When a technical choice
conflicts with a principle above, the principle wins unless a formal
amendment is ratified.

**Amendment procedure**:

1. Propose the change in a dedicated pull request modifying only this
   file
2. Document the rationale and the impact on existing code
3. Version bump follows semantic versioning:
   - MAJOR: Principle removed or fundamentally redefined
   - MINOR: New principle added or existing principle materially
     expanded
   - PATCH: Wording clarification, typo fix, non-semantic refinement
4. All active contributors MUST review and approve before merge
5. After merge, propagate changes to dependent templates and update
   the Sync Impact Report at the top of this file

**Compliance review**: At the start of each planning phase
(`/speckit.plan`), the Constitution Check section MUST verify that
the proposed design satisfies every principle. Violations MUST be
documented in the Complexity Tracking table with justification.

**Version**: 1.0.0 | **Ratified**: 2026-03-23 | **Last Amended**: 2026-03-23

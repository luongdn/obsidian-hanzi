# Implementation Plan: Offline Chinese Dictionary Lookup

**Branch**: `001-chinese-dict-lookup` | **Date**: 2026-03-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-chinese-dict-lookup/spec.md`

## Summary

Build an Obsidian plugin that provides offline Chinese-English dictionary lookup using the CC-CEDICT dictionary (downloaded on first load and cached locally). The plugin detects CJK characters at the cursor position (via CodeMirror 6 `hoverTooltip` for hover mode, selection change events for manual mode, and delegated `mouseover` with `caretRangeFromPoint` for reading mode), performs longest-match word lookup (up to 8 characters), and displays a theme-aware popup with Simplified form, Traditional form (if different), and pinyin with tone marks (optionally tone-colored using the Pleco color scheme) on a single line, followed by English definitions. The dictionary (~124K entries, 10MB) is parsed at plugin load time into a dual-map index: a primary `Map<string, DictionaryEntry[]>` keyed by Simplified form (~120K keys) plus a redirect `Map<string, string>` for Traditional→Simplified lookups (~76K entries), providing O(1) lookups while avoiding ~77K redundant array allocations.

## Technical Context

**Language/Version**: TypeScript 5.8+
**Bundler**: esbuild (CommonJS output, ES2018 target)
**Primary Dependencies**: `obsidian` (Plugin API), `@codemirror/view` (hoverTooltip), `@codemirror/state`
**Linter**: ESLint with `@coedit/eslint-plugin-obsidian`
**Package Manager**: npm
**Storage**: Dictionary file (`assets/cedict_ts.u8`, 10MB, ~124K entries) distributed as a GitHub release asset; downloaded on first load via `requestUrl()` and cached locally; loaded via `vault.adapter.read()`
**Testing**: Vitest (unit tests for core logic)
**Target Platform**: Obsidian desktop (Windows, macOS, Linux) and mobile (iOS, Android)
**Project Type**: Obsidian community plugin
**Performance Goals**: Dictionary load <2s, lookup <200ms, popup render <100ms, memory <50MB
**Constraints**: Offline after initial dictionary download, must not block main thread during dictionary loading
**Scale/Scope**: Single plugin, ~124K dictionary entries, 8 settings fields

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality First | PASS | Single-responsibility modules planned (parser, index, engine, popup, settings). ESLint enforced. TypeScript strict mode. |
| II. Testing Standards | PASS | Vitest unit tests planned for parser, pinyin conversion, detector, engine. Edge cases specified (missing dict, corrupted entries, non-CJK input). |
| III. User Experience Consistency | PASS | Popup uses Obsidian CSS variables. Settings use built-in Setting components. Errors via Notice API. No note content mutation. |
| IV. Performance Requirements | PASS | Dictionary load async (not blocking main thread). Map-based O(1) lookup. Targets: load <2s, lookup <200ms, memory <50MB. |

### Post-Phase 1 Re-check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality First | PASS | Module structure shows clear separation: dictionary/, lookup/, ui/, editor/. Each module has single responsibility. Dual-map index encapsulated behind `DictionaryIndex` interface. |
| II. Testing Standards | PASS | Test files mapped 1:1 to core modules. Fixture file for deterministic testing. Edge cases covered in data-model.md validation rules. Highlight and dismissal behaviors specified. |
| III. User Experience Consistency | PASS | Popup uses Obsidian CSS variables. Highlight uses `--text-highlight-bg`. Reading mode uses delegated listener (no DOM rewriting). Dismissal on cursor-away/click-outside in all modes. Errors via Notice API. |
| IV. Performance Requirements | PASS | Dual-map index: ~120K primary + ~76K redirect entries, O(1) lookup, saves ~77K redundant arrays vs single map. Async loading via `vault.adapter.read()`. Dictionary loaded via `this.manifest.dir` path. Memory budget well within 50MB. |

## Project Structure

### Documentation (this feature)

```text
specs/001-chinese-dict-lookup/
├── plan.md              # This file
├── research.md          # Phase 0: Technical research decisions
├── data-model.md        # Phase 1: Entity definitions and relationships
├── quickstart.md        # Phase 1: Setup and project structure guide
├── contracts/           # Phase 1: Interface contracts
│   ├── plugin-settings.ts
│   └── dictionary-types.ts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── main.ts                     # Plugin entry point (onload/onunload)
├── settings.ts                 # PluginSettings interface, defaults, SettingTab
├── dictionary/
│   ├── parser.ts               # CC-CEDICT line parser
│   ├── index.ts                # Dual-map dictionary index (Simplified primary + Trad→Simp redirect)
│   └── pinyin.ts               # Tone number → tone mark conversion
├── lookup/
│   ├── engine.ts               # Longest-match lookup algorithm
│   └── detector.ts             # CJK character detection (U+4E00–U+9FFF)
├── ui/
│   ├── popup.ts                # Popup DOM rendering with CSS variables
│   └── highlight.ts            # Character highlight decoration
└── editor/
    ├── hover-extension.ts      # CM6 hoverTooltip for editing mode
    ├── selection-extension.ts  # CM6 selection change handler
    └── reading-mode.ts         # Delegated mouseover listener for reading mode

tests/
├── unit/
│   ├── parser.test.ts
│   ├── pinyin.test.ts
│   ├── detector.test.ts
│   └── engine.test.ts
└── fixtures/
    └── test-dict.u8            # Small CC-CEDICT subset

assets/
└── cedict_ts.u8                # CC-CEDICT dictionary (10MB, downloaded on first load)

styles.css                      # Plugin styles (theme-aware via CSS variables)
manifest.json                   # Obsidian plugin manifest
package.json                    # Dependencies and scripts
tsconfig.json                   # TypeScript config (strict, ES6 target)
esbuild.config.mjs              # Build config (CommonJS, ES2018)
eslint.config.mts               # ESLint config
versions.json                   # Obsidian version compatibility
```

**Structure Decision**: Single project layout. The plugin is a self-contained Obsidian plugin with no backend or separate frontend. Source code organized by domain (dictionary, lookup, ui, editor) rather than by layer. Tests mirror source structure.

## Complexity Tracking

> No constitution violations detected. All principles satisfied by the current design.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)*  | —          | —                                   |

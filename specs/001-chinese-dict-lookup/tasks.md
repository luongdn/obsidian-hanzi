# Tasks: Offline Chinese Dictionary Lookup

**Input**: Design documents from `/specs/001-chinese-dict-lookup/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included — Vitest unit tests specified in plan.md and research.md (R-007).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, build tooling, and dependency configuration

- [X] T001 Create project directory structure: `src/dictionary/`, `src/lookup/`, `src/ui/`, `src/editor/`, `tests/unit/`, `tests/fixtures/`, `assets/`
- [X] T002 Initialize package.json with dependencies: `obsidian`, `@codemirror/view`, `@codemirror/state` (peer/external), `typescript`, `esbuild`, `eslint`, `vitest` (dev)
- [X] T003 [P] Configure tsconfig.json with strict mode, ES6 target, CommonJS module output
- [X] T004 [P] Configure esbuild.config.mjs: CommonJS output, ES2018 target, externals (`obsidian`, `electron`, `@codemirror/*`, `@lezer/*`), `DICT_URL` build-time injection via `define`
- [X] T005 [P] Create manifest.json with plugin metadata (id: `obsidian-hanzi`, minAppVersion) and versions.json
- [X] T006 [P] Configure eslint.config.mts with `@coedit/eslint-plugin-obsidian`
- [X] T007 [P] Configure Vitest in vitest.config.ts for unit testing with TypeScript support

**Checkpoint**: Build toolchain ready — `npm run build` and `npm run test` should execute (even if no source files yet)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core dictionary infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 [P] Implement CJK character detector in src/lookup/detector.ts — `isCJK(char)` using U+4E00–U+9FFF range check per R-005
- [X] T009 [P] Implement pinyin tone number to tone mark conversion in src/dictionary/pinyin.ts — handle tones 1-5, `u:` → `ü`, vowel placement rules per R-003
- [X] T010 [P] Create test fixture file tests/fixtures/test-dict.u8 — small CC-CEDICT subset (~20 entries) covering: single-char, multi-char words, homographs, trad≠simp entries, trad=simp entries
- [X] T011 Implement CC-CEDICT line parser in src/dictionary/parser.ts — regex `/^(.+?)\s(.+?)\s\[(.+?)\]\s\/(.+)\/$/`, skip `#` comments, return `DictionaryEntry[]` per R-002 and contracts/dictionary-types.ts
- [X] T012 Implement dual-map dictionary index in src/dictionary/index.ts — primary `Map<string, DictionaryEntry[]>` keyed by Simplified, redirect `Map<string, string>` for Traditional→Simplified per data-model.md `DictionaryIndex`, expose `lookup(key)`, `has(key)`, `size` per contracts/dictionary-types.ts
- [X] T013 Implement longest-match lookup engine in src/lookup/engine.ts — iterate from `maxLookAhead` (default 8) down to 1 char, return `LookupResult` with `matchType: 'longest' | 'exact'` per contracts/dictionary-types.ts
- [X] T014 [P] Define settings interface, defaults, and SettingTab class in src/settings.ts — `HanziPluginSettings` with all 7 fields, `DEFAULT_SETTINGS`, `HanziSettingTab extends PluginSettingTab` per contracts/plugin-settings.ts
- [X] T015 [P] Create base plugin styles in styles.css — `.hanzi-popup` container, `.hanzi-highlight` using `--text-highlight-bg`, theme-aware CSS variables (`--background-primary`, `--text-normal`, `--text-accent`, etc.) per R-006

**Checkpoint**: Foundation ready — dictionary can be parsed, indexed, and queried; settings defined; styles in place

---

## Phase 3: User Story 1 — Hover to Look Up a Chinese Character (Priority: P1) 🎯 MVP

**Goal**: User hovers over a Chinese character and sees a popup with Traditional/Simplified forms, pinyin, and definitions

**Independent Test**: Open a note with Chinese text, hover over a character, verify popup appears with correct dictionary data in both editing and reading modes

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T016 [P] [US1] Unit tests for CC-CEDICT parser in tests/unit/parser.test.ts — test line parsing, comment skipping, malformed line handling, multi-definition entries using test fixture
- [X] T017 [P] [US1] Unit tests for pinyin conversion in tests/unit/pinyin.test.ts — test all 4 tones + neutral, `u:` → `ü`, multi-syllable pinyin, edge cases
- [X] T018 [P] [US1] Unit tests for CJK detector in tests/unit/detector.test.ts — test CJK range boundaries (U+4E00, U+9FFF), Latin, numbers, Chinese punctuation, whitespace
- [X] T019 [P] [US1] Unit tests for lookup engine in tests/unit/engine.test.ts — test single-char lookup, longest-match preference, no-match returns undefined, homograph multiple entries

### Implementation for User Story 1

- [X] T020 [US1] Implement popup DOM rendering in src/ui/popup.ts — create popup element with Simplified form, Traditional form, and pinyin on a single line (in that order), followed by definitions list; use Obsidian CSS variables; respect all `PluginSettings` display toggles (showTraditional, showSimplified, showPinyin, showDefinitions) and popupFontSize per R-006
- [X] T021 [US1] Implement character highlight decoration in src/ui/highlight.ts — CM6 `StateField<DecorationSet>` with `StateEffect` for set/clear, `Decoration.mark` with `.hanzi-highlight` CSS class per R-011; cover full matched word range for multi-char matches
- [X] T022 [US1] Implement CM6 hover tooltip extension in src/editor/hover-extension.ts — `hoverTooltip()` handler: read char at pos, check `isCJK()`, extract up to `maxLookAhead` chars ahead, call engine `lookup()`, return `Tooltip` with popup DOM; integrate highlight set/clear per R-004
- [X] T023 [US1] Implement reading mode delegated listener in src/editor/reading-mode.ts — single `mouseover` on `.markdown-reading-view`, `caretRangeFromPoint` to find char, CJK check, lookup, show popup as absolutely positioned DOM element, dismiss on `mouseleave`/`click` outside, temporary `<span class="hanzi-highlight">` wrapper per R-004
- [X] T024 [US1] Implement plugin entry point in src/main.ts — `HanziPlugin extends Plugin`: `onload()` registers extensions, commands, and settings tab immediately, then defers dictionary loading to `onLayoutReady()` via `initDictionary()` (checks local cache first, downloads from `DICT_URL` via `requestUrl()` on first load, caches to `assets/cedict_ts.u8`), parses into `DictionaryIndex`, calls `refreshExtensions()` and `refreshReadingMode()` to activate lookups; handles load errors with `Notice`; `onunload()` cleans up per R-001, R-008

**Checkpoint**: User Story 1 fully functional — hover over Chinese character shows popup with all dictionary data in editing and reading modes

---

## Phase 4: User Story 2 — Manual Selection Mode for Lookup (Priority: P2)

**Goal**: User switches to "manual selection" mode; lookups trigger only on explicit text selection, not hover

**Independent Test**: Enable manual selection mode in settings, select a Chinese character, verify popup appears; hover without selecting should show nothing

### Implementation for User Story 2

- [X] T025 [US2] Implement CM6 selection change extension in src/editor/selection-extension.ts — `EditorView.updateListener` that checks `update.selectionSet`, extracts selected text, validates CJK, calls engine `lookup()`, shows popup via `showTooltip` StateEffect, dismisses on next selection change or click outside per R-004, R-010
- [X] T026 [US2] Update src/main.ts to conditionally register hover or selection extension based on `settings.triggerMode` — switch extensions when settings change without requiring restart (FR-009, SC-004)
- [X] T027 [US2] Implement mobile auto-fallback in src/main.ts — detect `Platform.isMobile`, force selection-based triggering regardless of `triggerMode` setting per R-009 (FR-016)

- [X] T038 [US2] Implement selection-based lookup in reading mode in src/editor/reading-mode.ts — when `triggerMode` is `selection`, listen for `selectionchange` events instead of `mousemove`; get selected text from browser Selection API, validate it's within the attached container, perform CJK check and lookup, show popup near selection; update src/main.ts `registerReadingMode` to re-attach on settings change (FR-008, FR-018)
- [X] T039 [US2] Register two command palette commands in src/main.ts — "Hanzi: Use hover mode" (`hanzi:use-hover-mode`) and "Hanzi: Use selection mode" (`hanzi:use-selection-mode`). Each command sets `settings.triggerMode`, calls `saveSettings()`, re-applies active extensions via existing mode-switching logic, and shows a `Notice` confirming the switch (FR-019, SC-004). On mobile, commands should still update the persisted setting but `Notice` should note that mobile always uses selection behavior.

**Checkpoint**: User Story 2 functional — manual selection mode works in both editing and reading modes, hover mode still works, mode switching is seamless via settings or command palette

---

## Phase 5: User Story 3 — Multi-Character Word Lookup (Priority: P2)

**Goal**: Selecting or hovering over multi-character words shows compound word entries (e.g., "学生" → xuéshēng/student) rather than individual characters

**Independent Test**: Hover over first character of "学生" — popup shows compound word entry; select "学生" — popup shows compound entry

### Implementation for User Story 3

- [X] T028 [US3] Enhance hover extension in src/editor/hover-extension.ts to extract text from cursor position up to `maxLookAhead` characters ahead from the document, passing full substring to the engine for longest-match resolution (FR-010)
- [X] T029 [US3] Enhance selection extension in src/editor/selection-extension.ts to pass full selected text (up to `maxLookAhead` chars) to engine for exact compound word lookup
- [X] T030 [US3] Enhance popup rendering in src/ui/popup.ts to display the matched word prominently when it is a multi-character compound (show the full word, not just individual character forms)

**Checkpoint**: Multi-character lookups work — compound words prioritized over single characters in both hover and selection modes

---

## Phase 6: User Story 4 — Configure Popup Content and Style (Priority: P3)

**Goal**: User customizes popup display (toggle fields, adjust font size) via Obsidian settings; popup adapts to theme changes

**Independent Test**: Change settings (disable pinyin, change font size), trigger a lookup, verify popup reflects new configuration; switch Obsidian theme, verify popup colors adapt

### Implementation for User Story 4

- [X] T031 [US4] Implement full settings tab UI in src/settings.ts — `HanziSettingTab.display()` with Obsidian `Setting` components: dropdown for triggerMode, toggles for showTraditional/showSimplified/showPinyin/showDefinitions/toneColoredPinyin, slider or input for popupFontSize (clamped 8-32), input for maxLookAhead (clamped 1-12)
- [X] T032 [US4] Wire settings changes to live popup behavior in src/main.ts — on settings save, update active extensions so next lookup uses new display toggles and font size without restart (SC-004, SC-006)
- [X] T033 [US4] Validate theme-aware styling in styles.css — ensure all popup elements use CSS variables, test with light/dark themes, add `--font-text` and `--font-ui-small` usage for popup typography per R-006
- [X] T040 [US4] Implement tone-colored pinyin in src/ui/popup.ts — when `settings.toneColoredPinyin` is true, render each pinyin syllable as a separate `<span>` with inline color based on its tone number using the Pleco color scheme: Tone 1 `#e30000` (red), Tone 2 `#e68a00` (orange), Tone 3 `#00802b` (green), Tone 4 `#1510f0` (blue), Tone 5 `#808080` (gray). Use `pinyinRaw` from `DictionaryEntry` to determine tone numbers. When disabled, render pinyin as a single span with default `--text-muted` color (FR-020, FR-021)
- [X] T041 [US4] Add `toneColoredPinyin` toggle to settings tab in src/settings.ts — add a toggle in `HanziSettingTab.display()` for "Tone-Colored Pinyin" (default: true) with description "Color pinyin syllables by tone (Pleco color scheme)" (FR-021)
- [X] T042 [P] [US4] Add CSS classes for tone-colored pinyin in styles.css — `.hanzi-tone-1` through `.hanzi-tone-5` with corresponding colors, used as fallback/override classes alongside inline styles

**Checkpoint**: All settings functional — popup content and style fully configurable, theme-aware

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, and final validation

- [X] T034 Implement graceful error handling for missing/corrupted dictionary in src/main.ts — `Notice` on parse failure, plugin enters degraded mode (no lookups) without crashing (FR-014)
- [X] T035 Handle edge cases across all modes — cursor between characters (no popup), Chinese punctuation excluded, empty selection in manual mode ignored, homograph multiple entries all displayed per spec Edge Cases
- [X] T036 [P] Validate build and release pipeline — ensure `npm run build` produces `main.js`, `manifest.json`, `styles.css` in output; GitHub Actions release workflow uploads `cedict_ts.u8` as release asset and injects `DICT_URL` at build time; plugin loads in Obsidian and downloads dictionary on first use
- [X] T037 [P] Run full test suite and lint — `npm run test`, `npm run lint`, fix any issues; validate all unit tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — core MVP
- **User Story 2 (Phase 4)**: Depends on Foundational; integrates with US1 popup/highlight components
- **User Story 3 (Phase 5)**: Depends on Foundational; enhances US1 hover-extension and US2 selection-extension
- **User Story 4 (Phase 6)**: Depends on Foundational; enhances US1 popup and main.ts
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependencies on other stories
- **US2 (P2)**: After Foundational — reuses popup/highlight from US1 (can start after T020-T021)
- **US3 (P2)**: After Foundational — enhances extensions from US1/US2 (can start after T022, T025)
- **US4 (P3)**: After Foundational — enhances popup/main.ts from US1 (can start after T020, T024)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core components before integrations
- Each story independently testable at its checkpoint

### Parallel Opportunities

- **Phase 1**: T003, T004, T005, T006, T007 all parallel (after T001-T002)
- **Phase 2**: T008, T009, T010, T014, T015 all parallel; T011 after T009; T012 after T008, T011; T013 after T012
- **Phase 3**: T016-T019 all parallel (tests); T020-T021 parallel; T022 after T020, T021; T023 parallel with T022; T024 after T022, T023
- **Phase 4**: T025 can parallel with T026; T027 after T026; T039 after T026 (reuses mode-switching logic)
- **Phase 5**: T028, T029 parallel; T030 after both
- **Phase 7**: T036, T037 parallel

---

## Parallel Example: User Story 1

```bash
# Launch all unit tests in parallel:
Task: "Unit tests for parser in tests/unit/parser.test.ts"
Task: "Unit tests for pinyin in tests/unit/pinyin.test.ts"
Task: "Unit tests for detector in tests/unit/detector.test.ts"
Task: "Unit tests for engine in tests/unit/engine.test.ts"

# Then launch popup and highlight in parallel:
Task: "Popup DOM rendering in src/ui/popup.ts"
Task: "Character highlight decoration in src/ui/highlight.ts"

# Then hover and reading mode (can overlap):
Task: "CM6 hover tooltip extension in src/editor/hover-extension.ts"
Task: "Reading mode delegated listener in src/editor/reading-mode.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Hover lookup works in editing + reading mode
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (hover lookup) → Test independently → **MVP!**
3. Add US2 (manual selection) → Test independently → Selection mode works
4. Add US3 (multi-char words) → Test independently → Compound lookups work
5. Add US4 (settings UI) → Test independently → Fully configurable
6. Polish → Final validation → Release-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP)
   - Developer B: User Story 2 (after US1 popup/highlight done)
3. After US1 complete:
   - Developer A: User Story 3
   - Developer B: User Story 4
4. Stories integrate independently

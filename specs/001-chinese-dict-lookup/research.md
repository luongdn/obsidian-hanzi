# Research: Offline Chinese Dictionary Lookup

**Feature Branch**: `001-chinese-dict-lookup`
**Date**: 2026-03-23

## R-001: Obsidian Plugin Architecture & Build Setup

**Decision**: Use the official Obsidian sample plugin template structure with TypeScript, esbuild, and ESLint.

**Rationale**: The official template (`obsidianmd/obsidian-sample-plugin`) is the canonical starting point. It provides esbuild bundling (CommonJS output, ES2018 target), TypeScript with strict settings, ESLint with the `@coedit/eslint-plugin-obsidian` plugin, and a standard manifest.json format. The plugin class extends `Plugin` from the `obsidian` package, with lifecycle methods `onload()` and `onunload()`.

**Alternatives considered**:
- Rollup/Webpack bundlers — rejected; esbuild is the officially recommended bundler, faster, and simpler to configure
- JavaScript without TypeScript — rejected; the spec requires type safety and the constitution mandates strict code quality

**Key details**:
- Entry point: `src/main.ts` → output: `main.js` (CommonJS)
- External modules: `obsidian`, `electron`, `@codemirror/*`, `@lezer/*`
- manifest.json fields: id, name, version, minAppVersion, description, author, isDesktopOnly
- Settings persisted via `plugin.loadData()` / `plugin.saveData()`
- Plugin settings UI via `PluginSettingTab` class
- Styles in `styles.css` at project root

## R-002: CC-CEDICT Dictionary Format & Parsing

**Decision**: Parse the bundled `cedict_ts.u8` file at plugin load time into a dual-map index: a primary `Map<string, DictionaryEntry[]>` keyed by Simplified form, plus a redirect `Map<string, string>` mapping Traditional→Simplified for entries where the forms differ.

**Rationale**: CC-CEDICT uses a well-defined line format:
```
Traditional Simplified [pin1 yin1] /definition1/definition2/
```
The bundled file is 10MB with ~124,443 entries and ~124,472 lines (including 29 comment/header lines starting with `#`). Parsing is straightforward: split each non-comment line by regex to extract Traditional, Simplified, pinyin, and definitions.

Analysis of the actual dictionary file shows:
- 62.3% of entries (77,493) have different Traditional and Simplified forms
- 37.7% of entries (46,950) have identical forms
- A single dual-keyed map would need ~197K keys with ~77K duplicate arrays
- The dual-map approach needs ~120K primary keys + ~76K lightweight string→string redirects

The dual-map design saves ~77K array allocations by storing only one `DictionaryEntry[]` per canonical (Simplified) key, with a cheap string redirect for Traditional lookups. Lookup remains O(1): check primary map first, on miss check redirect map and follow to the primary key.

**Alternatives considered**:
- Single `Map<string, DictionaryEntry[]>` dual-keyed by both Traditional and Simplified (Option A) — rejected; wastes ~77K duplicate array allocations for entries where trad ≠ simp, which is 62% of all entries
- Primary map keyed by Traditional + simp→trad redirect (Option C) — equivalent structure but Simplified chosen as canonical key since it's the more common form in modern text and CC-CEDICT sorts by Traditional first (making Simplified the "working" form)
- SQLite/IndexedDB storage — rejected; adds complexity, the dictionary is small enough to hold in memory
- Pre-compiled JSON at build time — viable future optimization (spec notes dictionary is frozen per release), deferred for simplicity
- Trie data structure — considered for prefix matching; rejected since Map with longest-match iteration (8 chars down to 1) is simpler and meets the <200ms lookup requirement

**Key details**:
- Line regex: `/^(.+?)\s(.+?)\s\[(.+?)\]\s\/(.+)\/$/`
- Pinyin uses tone numbers (1-5); convert to tone marks for display (e.g., `xue2` → `xué`)
- `ü` encoded as `u:` in the file (e.g., `nu:3` → `nǚ`)
- Comment lines start with `#`
- Primary map: `Map<string, DictionaryEntry[]>` keyed by Simplified form (~120K keys)
- Redirect map: `Map<string, string>` mapping Traditional→Simplified (~76K entries, only where trad ≠ simp)
- Lookup path: `primary.get(key) ?? primary.get(redirect.get(key))` — O(1)
- Multiple entries can map to the same character/word (homographs)

## R-003: Pinyin Tone Number to Tone Mark Conversion

**Decision**: Implement a utility function to convert numbered pinyin (e.g., `xue2`) to tone-marked pinyin (e.g., `xué`).

**Rationale**: CC-CEDICT stores pinyin with tone numbers, but users expect tone marks in the popup display. The conversion rules are well-defined:
- Tone marks go on the vowel (a, e, o get priority; otherwise the second vowel in a pair)
- Tone 5 (neutral) has no mark
- `u:` must be converted to `ü` before applying tone marks

**Alternatives considered**:
- Display raw tone numbers — rejected; tone marks are the standard for learners
- Use a third-party pinyin library — rejected; the conversion is simple (~30 lines) and avoids an extra dependency

## R-004: Hover-Based Lookup via CodeMirror 6

**Decision**: Use Obsidian's `registerEditorExtension()` with a CodeMirror 6 `hoverTooltip` extension for hover mode, and editor selection change events for manual selection mode.

**Rationale**: Obsidian's editor is built on CodeMirror 6. The `@codemirror/view` package provides `hoverTooltip()` which creates tooltips on hover with automatic positioning and dismissal. For reading mode, use Obsidian's `registerMarkdownPostProcessor()` to add event listeners to rendered Chinese characters.

**Alternatives considered**:
- Obsidian's built-in `onHoverLink` — only works for links, not arbitrary text
- Custom mousemove listener — more code, worse positioning; `hoverTooltip` handles viewport boundaries natively
- `EditorSuggest` — designed for autocomplete, not dictionary popups

**Key details**:
- `hoverTooltip()` receives a function `(view, pos, side) => Tooltip | null`
- At `pos`, read the character from the document, check if CJK Unified Ideograph (U+4E00–U+9FFF)
- Perform longest-match lookup (up to 8 chars ahead)
- Return a `Tooltip` with a `create()` method that renders the popup DOM
- `hoverTooltip` handles dismissal automatically when cursor leaves the hover area
- For mobile: detect `Platform.isMobile` and use selection-based triggering

### Reading mode approach

For reading mode, attach a single delegated `mouseover` listener to the `.markdown-reading-view` container rather than wrapping individual characters via `MarkdownPostProcessor`. On `mouseover`:
1. Use `document.caretRangeFromPoint(e.clientX, e.clientY)` (or `caretPositionFromPoint` on Firefox) to find the exact character under the cursor
2. Check if the character is a CJK Unified Ideograph
3. If yes, run the same lookup engine and show a popup positioned near the cursor
4. Dismiss on `mouseout` from the popup or `click` outside

This avoids the cost and fragility of rewriting all rendered DOM via a post-processor.

## R-005: CJK Character Detection

**Decision**: Use Unicode range check `\u4E00-\u9FFF` for CJK Unified Ideographs.

**Rationale**: This range covers the Basic CJK Unified Ideographs block which contains virtually all characters in CC-CEDICT. The spec explicitly states only CJK Unified Ideograph characters trigger lookup (not punctuation like `。`, `，`).

**Alternatives considered**:
- Extended CJK ranges (Extension A: U+3400–U+4DBF, Extension B+: U+20000+) — not needed; CC-CEDICT entries are within the basic range
- Regex `\p{Script=Han}` — includes CJK punctuation which we want to exclude

**Key details**:
- Check: `(charCode >= 0x4E00 && charCode <= 0x9FFF)`
- Chinese punctuation (U+3000–U+303F, U+FF00–U+FFEF) explicitly excluded
- Whitespace, Latin, numbers all excluded

## R-006: Popup Rendering & Theme Integration

**Decision**: Render popup as a plain DOM element using Obsidian CSS variables for theme-aware styling.

**Rationale**: Obsidian themes expose CSS custom properties (e.g., `--background-primary`, `--text-normal`, `--font-text`). Using these variables ensures the popup adapts to any theme automatically. The popup is rendered inside the CodeMirror tooltip container which handles positioning.

**Alternatives considered**:
- React/Svelte component — rejected; unnecessary complexity for a simple popup, adds bundle size
- Obsidian's `HoverPopover` — internal API, not stable for plugins

**Key details**:
- Use CSS variables: `--background-primary`, `--background-secondary`, `--text-normal`, `--text-muted`, `--text-accent`, `--font-text`, `--font-ui-small`
- Popup structure: character display (Trad/Simp), pinyin row, definitions list
- Configurable fields hidden via CSS classes toggled by settings
- Font size override applied as inline style when configured

## R-007: Testing Strategy

**Decision**: Use Vitest for unit testing with mocked Obsidian API.

**Rationale**: Vitest is fast, TypeScript-native, and compatible with esbuild. The core logic (dictionary parsing, lookup engine, pinyin conversion) can be unit tested without Obsidian. Integration with Obsidian's editor requires manual testing or the Obsidian plugin test framework.

**Alternatives considered**:
- Jest — heavier, slower cold start; Vitest is a better fit for esbuild projects
- No testing framework — rejected; constitution mandates testing

**Key details**:
- Test dictionary parser with a small fixture file
- Test lookup engine with known entries
- Test pinyin conversion for all tone marks and edge cases (ü, neutral tone)
- Test CJK detection for boundary characters
- Test longest-match algorithm
- Manual integration testing in Obsidian for popup rendering and editor interaction

## R-008: Dictionary Bundling & Loading Strategy

**Decision**: Bundle `cedict_ts.u8` in `assets/` alongside `main.js`. Load at runtime via `this.app.vault.adapter.read()`. Copy the file to the output directory using a build script since esbuild only bundles JS.

**Rationale**: The dictionary is 10MB uncompressed. Obsidian plugins distribute files alongside `main.js` in the plugin's vault directory (`<vault>/.obsidian/plugins/<plugin-id>/`). esbuild does not handle non-JS assets, so the build process must copy `assets/cedict_ts.u8` to the output location.

**Loading path**:
```typescript
const dictPath = normalizePath(this.manifest.dir + '/assets/cedict_ts.u8');
const content = await this.app.vault.adapter.read(dictPath);
```

`vault.adapter.read()` returns a UTF-8 string (the dictionary is UTF-8 encoded), works on both desktop and mobile, and doesn't require filesystem access outside the vault. The `this.manifest.dir` property gives the plugin's installation directory relative to the vault root.

**Build asset copying**: Add a post-build step in `esbuild.config.mjs` (or npm script) that copies `assets/` to the output directory. For dev workflow with a symlinked plugin directory, the assets are already in place.

**Alternatives considered**:
- `FileSystemAdapter.readBinary()` — works but returns `ArrayBuffer` requiring decoding; `read()` returns string directly
- `fetch()` from plugin URL — not portable across desktop/mobile; vault adapter is the canonical Obsidian way
- Embed dictionary in main.js as a string/JSON — rejected; would make the JS file enormous and slow to parse
- Download on first use — rejected; spec requires fully offline operation
- Pre-compiled binary format — viable future optimization, deferred for simplicity

## R-010: Popup Dismissal Mechanics

**Decision**: In editing mode, rely on `hoverTooltip`'s built-in dismissal. In reading mode and selection mode, manage dismissal manually via `mouseout` and `click` listeners.

**Rationale**: The spec requires popup dismissal on "cursor-move-away OR click-outside, whichever occurs first." CodeMirror 6's `hoverTooltip` already handles this for editing mode — the tooltip is dismissed when the mouse leaves the hover zone. For reading mode and selection-triggered popups (which are not CM6 tooltips), we need manual event management.

**Key details**:
- **Editing mode (hover)**: `hoverTooltip` auto-dismisses. No extra code needed.
- **Editing mode (selection)**: Show popup via CM6 `showTooltip` StateEffect. Dismiss on: next selection change (EditorView.updateListener), or click outside popup element.
- **Reading mode**: Show popup as an absolutely positioned DOM element appended to the reading view container. Dismiss on: `mouseleave` from popup element, `click` on `document` (filtered to exclude clicks inside the popup), or scroll event on the reading container.
- Popup element captures `mouseenter`/`mouseleave` to allow hovering over the popup itself (e.g., to select text from definitions) without dismissing it.

## R-011: Character Highlighting (FR-005)

**Decision**: In editing mode, use a CM6 `Decoration.mark` to apply a CSS class to the looked-up character range. In reading mode, use a temporary `<mark>` wrapper or CSS `outline` on the text node range.

**Rationale**: FR-005 requires visually highlighting the character or word being looked up while the popup is visible. The highlight must be removed when the popup is dismissed.

**Key details**:
- **Editing mode**: Create a `StateField<DecorationSet>` that holds the active highlight decoration. Set it via a `StateEffect` when lookup triggers, clear it when the popup is dismissed. The decoration applies a CSS class (e.g., `.hanzi-highlight`) styled with a background color using Obsidian's `--text-highlight-bg` CSS variable.
- **Reading mode**: Use `Range.surroundContents()` to wrap the target text node in a `<span class="hanzi-highlight">`, or apply a CSS highlight via the Selection API. Remove the wrapper on popup dismiss.
- The highlight must cover the full matched word (not just the hovered character) for multi-character matches.

## R-009: Mobile Support

**Decision**: Detect mobile via `Platform.isMobile` and use selection-based lookup regardless of trigger mode setting.

**Rationale**: Mobile devices don't support hover events. The spec mandates auto-fallback to tap-to-select on mobile. Obsidian's `Platform` API provides reliable platform detection.

**Key details**:
- On mobile, register selection change listener instead of hover tooltip
- Selection triggers the same lookup + popup logic
- Popup positioning handled by CodeMirror or manual placement near selection

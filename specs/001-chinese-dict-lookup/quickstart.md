# Quickstart: Offline Chinese Dictionary Lookup

**Feature Branch**: `001-chinese-dict-lookup`

## Prerequisites

- Node.js 18+
- npm 9+
- Obsidian 1.5+ (for testing)

## Setup

```bash
git clone <repo-url> obsidian-hanzi
cd obsidian-hanzi
git checkout 001-chinese-dict-lookup
npm install
```

## Development

```bash
npm run dev       # Build with watch mode
npm run build     # Production build (typecheck + bundle)
npm run lint      # Run ESLint
npm run test      # Run Vitest unit tests
```

## Testing in Obsidian

1. Create a test vault or use an existing one
2. Create the plugin directory: `<vault>/.obsidian/plugins/obsidian-hanzi/`
3. Symlink or copy build output:
   - `main.js`
   - `manifest.json`
   - `styles.css`
   - `assets/cedict_ts.u8`
4. Enable "Obsidian Hanzi" in Settings → Community Plugins
5. Open a note with Chinese text and hover over a character

## Project Structure

```
obsidian-hanzi/
├── src/
│   ├── main.ts                 # Plugin entry point
│   ├── settings.ts             # Settings interface, defaults, and tab
│   ├── dictionary/
│   │   ├── parser.ts           # CC-CEDICT file parser
│   │   ├── index.ts            # Dictionary index (Map-based lookup)
│   │   └── pinyin.ts           # Tone number → tone mark conversion
│   ├── lookup/
│   │   ├── engine.ts           # Longest-match lookup logic
│   │   └── detector.ts         # CJK character detection utilities
│   ├── ui/
│   │   ├── popup.ts            # Popup DOM rendering
│   │   └── highlight.ts        # Character highlight decoration
│   └── editor/
│       ├── hover-extension.ts  # CM6 hoverTooltip extension
│       ├── selection-extension.ts # CM6 selection change handler
│       └── reading-mode.ts     # Reading mode post-processor
├── tests/
│   ├── unit/
│   │   ├── parser.test.ts
│   │   ├── pinyin.test.ts
│   │   ├── detector.test.ts
│   │   └── engine.test.ts
│   └── fixtures/
│       └── test-dict.u8        # Small CC-CEDICT subset for testing
├── assets/
│   └── cedict_ts.u8            # Bundled CC-CEDICT dictionary
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── eslint.config.mts
├── styles.css
└── versions.json
```

## Key Modules

| Module | Responsibility |
|--------|---------------|
| `dictionary/parser.ts` | Parse CC-CEDICT lines into `DictionaryEntry` objects |
| `dictionary/index.ts` | Dual-map index: Simplified primary map + Traditional→Simplified redirect |
| `dictionary/pinyin.ts` | Convert tone numbers to tone marks (e.g., `xue2` → `xué`) |
| `lookup/engine.ts` | Longest-match lookup (up to 8 chars), fallback to single char |
| `lookup/detector.ts` | CJK Unicode range check, character validation |
| `ui/popup.ts` | Render popup DOM with theme-aware CSS variables |
| `editor/hover-extension.ts` | CM6 `hoverTooltip` for hover mode in editor |
| `editor/selection-extension.ts` | CM6 selection handler for manual mode |
| `editor/reading-mode.ts` | Delegated `mouseover` listener + `caretRangeFromPoint` for reading mode |
| `settings.ts` | Plugin settings interface, defaults, and settings tab |

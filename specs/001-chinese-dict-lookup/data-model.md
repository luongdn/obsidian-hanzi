# Data Model: Offline Chinese Dictionary Lookup

**Feature Branch**: `001-chinese-dict-lookup`
**Date**: 2026-03-23

## Entities

### DictionaryEntry

Represents a single parsed CC-CEDICT record.

| Field        | Type       | Description                                      | Constraints                |
|-------------|------------|--------------------------------------------------|----------------------------|
| traditional | `string`   | Traditional Chinese form                         | Non-empty, CJK characters  |
| simplified  | `string`   | Simplified Chinese form                          | Non-empty, CJK characters  |
| pinyin      | `string`   | Pinyin with tone marks (converted from numbers)  | Non-empty                  |
| pinyinRaw   | `string`   | Original pinyin with tone numbers from CC-CEDICT | Non-empty                  |
| definitions | `string[]` | English definitions (each slash-delimited entry) | At least one entry         |

**Notes**:
- A single character/word may have multiple `DictionaryEntry` records (homographs with different pronunciations)
- Both `traditional` and `simplified` fields may be identical for characters that are the same in both systems

### DictionaryIndex

Dual-map in-memory index optimized for memory efficiency.

| Field           | Type                              | Description                                                    |
|----------------|-----------------------------------|----------------------------------------------------------------|
| entries        | `Map<string, DictionaryEntry[]>`  | Primary map: Simplified form → matching entries (~120K keys)   |
| tradToSimp     | `Map<string, string>`             | Redirect map: Traditional form → Simplified form (~76K entries)|

**Indexing strategy**:
- Primary map is keyed by Simplified form. Each key maps to all `DictionaryEntry` records sharing that Simplified form (handles homographs).
- Redirect map stores Traditional→Simplified mappings only for entries where `traditional !== simplified` (62.3% of entries, ~76K redirects).
- When `traditional === simplified` (37.7% of entries), no redirect entry is needed — the primary map already covers both forms.
- Lookup path: `entries.get(key) ?? entries.get(tradToSimp.get(key) ?? '')` — O(1) in all cases.
- Supports multi-character words (e.g., "学生" maps to its compound entry).

**Memory profile**:
- ~120K primary map entries (Simplified keys → `DictionaryEntry[]` arrays)
- ~76K redirect map entries (Traditional keys → Simplified strings)
- vs. a single dual-keyed map that would need ~197K keys with ~77K duplicate arrays
- Net saving: eliminates ~77K redundant array allocations

### LookupResult

The resolved result of a dictionary lookup at a cursor position.

| Field      | Type               | Description                                          |
|-----------|--------------------|------------------------------------------------------|
| word      | `string`           | The matched text from the document                   |
| entries   | `DictionaryEntry[]`| All dictionary entries matching the word              |
| matchType | `'exact' \| 'longest'` | Whether matched as exact selection or longest-match |

### PluginSettings

User-configurable preferences persisted via Obsidian's data API.

| Field              | Type                          | Default          | Description                              |
|-------------------|-------------------------------|------------------|------------------------------------------|
| triggerMode       | `'hover' \| 'selection'`     | `'hover'`        | How lookups are triggered                |
| showTraditional   | `boolean`                     | `true`           | Display Traditional characters in popup  |
| showSimplified    | `boolean`                     | `true`           | Display Simplified characters in popup   |
| showPinyin        | `boolean`                     | `true`           | Display pinyin in popup                  |
| showDefinitions   | `boolean`                     | `true`           | Display definitions in popup             |
| popupFontSize     | `number`                      | `14`             | Font size in pixels for popup content    |
| toneColoredPinyin | `boolean`                     | `true`           | Color pinyin syllables by tone (Pleco scheme) |
| maxLookAhead      | `number`                      | `8`              | Max characters to scan for longest match |

**Persistence**: Serialized as JSON via `Plugin.loadData()` / `Plugin.saveData()`.

### ActiveHighlight

Transient state representing the currently highlighted character range while a popup is visible.

| Field      | Type     | Description                                          |
|-----------|----------|------------------------------------------------------|
| from      | `number` | Start offset in the document (editing mode) or DOM range start (reading mode) |
| to        | `number` | End offset (exclusive)                               |

**Notes**:
- In editing mode, managed as a CM6 `StateField<DecorationSet>` set/cleared via `StateEffect`
- In reading mode, managed as a temporary DOM `<span>` wrapper
- Cleared when popup is dismissed

## Relationships

```
DictionaryEntry  ←(1:N)→  DictionaryIndex.entries[key]
     ↑
     |
LookupResult.entries  ←(contains)→  DictionaryEntry[]
     ↑
     |
PluginSettings  →(configures)→  LookupResult display
```

## State Transitions

### Plugin Lifecycle

```
[Unloaded] → onload() → [Loading Dictionary]
[Loading Dictionary] → dict cached locally → read from disk → [Parsing]
[Loading Dictionary] → dict not cached → download via requestUrl() → cache to disk → [Parsing]
[Loading Dictionary] → download failed → [Error State]
[Parsing] → parse complete → [Ready]
[Parsing] → parse error → [Error State]
[Ready] → onunload() → [Unloaded]
[Error State] → Notice displayed → [Degraded: no lookups]
```

### Lookup Flow

```
[Idle] → hover/select CJK char → [Detecting]
[Detecting] → non-CJK → [Idle]
[Detecting] → CJK found → [Looking Up]
[Looking Up] → entries found → [Displaying Popup]
[Looking Up] → no entries → [Idle]
[Displaying Popup] → cursor moves / click outside → [Idle]
```

## Validation Rules

- Dictionary entries with missing fields (no traditional, no pinyin, no definitions) are skipped during parsing
- Characters outside CJK Unified Ideograph range (U+4E00–U+9FFF) do not trigger lookup
- `maxLookAhead` clamped to range [1, 12]
- `popupFontSize` clamped to range [8, 32]
- Empty selection in manual mode does not trigger lookup

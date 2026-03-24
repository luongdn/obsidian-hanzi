# Feature Specification: Offline Chinese Dictionary Lookup

**Feature Branch**: `001-chinese-dict-lookup`
**Created**: 2026-03-23
**Status**: Draft
**Input**: User description: "Create obsidian-hanzi, an Obsidian plugin with offline dictionary lookup for Chinese characters at cursor position using CC-CEDICT, supporting Traditional and Simplified Chinese, with configurable popup display and theme-aware styling."

## Clarifications

### Session 2026-03-23

- Q: How should the plugin trigger lookups on mobile (where hover doesn't exist)? → A: Auto-fallback — use hover on desktop, tap-to-select on mobile regardless of the trigger mode setting.
- Q: How should the popup be dismissed? → A: Dismiss on cursor-move-away OR click-outside, whichever happens first.
- Q: Should the plugin work in both editing mode (Live Preview) and reading mode? → A: Both editing mode and reading mode.
- Q: What is the maximum number of characters to scan ahead for longest-match word lookup? → A: 8 characters.
- Q: Can users update the CC-CEDICT dictionary file, or is it frozen per plugin release? → A: Frozen — dictionary updates only via plugin releases. This enables future optimization on the fixed dictionary file.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hover to Look Up a Chinese Character (Priority: P1)

A user is reading a note containing Chinese text. They hover their cursor over a Chinese character they don't recognize. The plugin detects the character under the cursor, looks it up in the bundled CC-CEDICT dictionary, and displays a popup showing the character (both Traditional and Simplified forms), pinyin pronunciation, and all matching dictionary translations.

**Why this priority**: This is the core feature of the plugin — without hover-based dictionary lookup, the plugin has no value.

**Independent Test**: Can be fully tested by opening a note with Chinese text, hovering over a character, and verifying the popup appears with correct dictionary data.

**Acceptance Scenarios**:

1. **Given** a note contains the character "学", **When** the user hovers over it, **Then** a popup appears showing: Traditional form (學), Simplified form (学), pinyin (xué), and all CC-CEDICT translation entries.
2. **Given** a note contains the character "國", **When** the user hovers over it, **Then** the popup shows both Traditional (國) and Simplified (国) forms with all translations.
3. **Given** the user hovers over a non-Chinese character (e.g., "A" or "5"), **When** the hover event fires, **Then** no popup is displayed.
4. **Given** the user hovers over a Chinese character, **When** the popup appears, **Then** the character under the cursor is visually highlighted (selected).
5. **Given** the device has no internet connection, **When** the user hovers over a Chinese character, **Then** the lookup still works using the bundled offline dictionary.

---

### User Story 2 - Manual Selection Mode for Lookup (Priority: P2)

A user prefers not to see popups on every hover. They switch the plugin to "manual selection" mode in settings. Now, they must explicitly select (highlight) a character or word in their note to trigger the dictionary popup.

**Why this priority**: Provides an essential alternative interaction mode that prevents unwanted popups during normal editing, improving usability for power users.

**Independent Test**: Can be tested by enabling manual selection mode in settings, selecting a Chinese character, and verifying the popup appears only on selection.

**Acceptance Scenarios**:

1. **Given** the plugin is set to "manual selection" mode, **When** the user selects a Chinese character or word, **Then** the dictionary popup appears with the lookup results.
2. **Given** the plugin is set to "manual selection" mode, **When** the user hovers over a Chinese character without selecting it, **Then** no popup is displayed.
3. **Given** the plugin is set to "hover" mode (default), **When** the user hovers over a Chinese character, **Then** the popup appears without requiring manual selection.

---

### User Story 3 - Multi-Character Word Lookup (Priority: P2)

A user selects a multi-character Chinese word (e.g., "学生") in their note. The plugin looks up the full word in the dictionary and displays the combined entry, rather than only the individual character.

**Why this priority**: Many Chinese words are multi-character compounds; looking up only single characters provides incomplete or misleading translations.

**Independent Test**: Can be tested by selecting a multi-character word and verifying the popup shows the compound word entry.

**Acceptance Scenarios**:

1. **Given** the user selects "学生", **When** the lookup triggers, **Then** the popup shows the compound word entry (xuéshēng - student) rather than individual character entries.
2. **Given** the user selects a multi-character string that exists in the dictionary, **When** the lookup triggers, **Then** the compound entry is displayed with all translations.
3. **Given** the user hovers over one character of a multi-character word (in hover mode), **When** the popup appears, **Then** the plugin attempts to match the longest word starting at the cursor position from the dictionary before falling back to single-character lookup.

---

### User Story 4 - Configure Popup Content and Style (Priority: P3)

A user wants to customize what information appears in the popup (e.g., hide pinyin, show only Simplified form) and adjust popup styling. They open the Obsidian plugin settings page and configure display options and style overrides.

**Why this priority**: Customization improves user experience but is not required for core functionality.

**Independent Test**: Can be tested by changing settings and verifying the popup reflects the new configuration.

**Acceptance Scenarios**:

1. **Given** the user disables "Show Pinyin" in settings, **When** a dictionary popup appears, **Then** the pinyin line is not shown.
2. **Given** the user disables "Show Traditional Characters" in settings, **When** a popup appears, **Then** only Simplified characters are shown.
3. **Given** the user modifies popup style settings (e.g., font size), **When** a popup appears, **Then** the popup reflects the custom style.
4. **Given** the user switches Obsidian themes, **When** a dictionary popup appears, **Then** the popup styling adapts to match the current theme.

---

### Edge Cases

- What happens when a character exists in CC-CEDICT only as Traditional but the note uses Simplified (or vice versa)? The plugin should resolve both directions and display the matching entry.
- What happens when the cursor is between two characters? No popup should appear.
- What happens when the user hovers over a Chinese punctuation mark (e.g., "。", "，")? No popup should be displayed — only CJK Unified Ideograph characters trigger lookup.
- What happens when the dictionary file is missing or corrupted? The plugin should display an error notification and degrade gracefully without crashing.
- What happens when multiple dictionary entries match the same character? All entries should be displayed in the popup.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST perform dictionary lookups entirely offline using a bundled CC-CEDICT dictionary file.
- **FR-002**: System MUST detect Chinese characters (CJK Unified Ideographs) at the current cursor/hover position.
- **FR-003**: System MUST support lookup of both Traditional and Simplified Chinese characters, resolving entries regardless of which form appears in the note.
- **FR-004**: System MUST display a popup containing: character(s) (Traditional and Simplified forms), pinyin with tone marks, and all matching translation entries from the dictionary.
- **FR-005**: System MUST visually highlight (select) the character or word being looked up when the popup is displayed.
- **FR-006**: System MUST NOT display a popup when the cursor is over a non-Chinese character (Latin letters, numbers, punctuation, Chinese punctuation, whitespace).
- **FR-007**: System MUST support a "hover" trigger mode (default) where hovering over a character triggers lookup.
- **FR-008**: System MUST support a "manual selection" trigger mode where only explicitly selected text triggers lookup.
- **FR-009**: System MUST allow users to toggle between hover and manual selection trigger modes via plugin settings.
- **FR-019**: System MUST register two Obsidian commands accessible via the command palette (Cmd/Ctrl+P): "Hanzi: Use hover mode" and "Hanzi: Use selection mode". Each command switches the trigger mode to the specified mode and persists the change to settings immediately. A Notice MUST confirm the mode change (e.g., "Hanzi: Switched to hover mode").
- **FR-016**: On mobile devices (where hover is unavailable), the system MUST automatically fall back to tap-to-select behavior regardless of the configured trigger mode.
- **FR-017**: The popup MUST be dismissed when the cursor moves away from the looked-up character OR when the user clicks outside the popup, whichever occurs first.
- **FR-018**: The plugin MUST function in both Obsidian's editing mode (Live Preview) and reading mode.
- **FR-010**: System MUST attempt longest-match word lookup (scanning up to 8 characters ahead from cursor position) before falling back to single-character lookup when in hover mode.
- **FR-011**: System MUST style the popup to follow the active Obsidian theme's colors, fonts, and visual conventions.
- **FR-012**: System MUST allow users to configure which popup fields are displayed (Traditional characters, Simplified characters, pinyin, translations) via plugin settings.
- **FR-013**: System MUST allow users to configure popup style overrides (e.g., font size) via plugin settings.
- **FR-014**: System MUST handle missing or corrupted dictionary files gracefully by showing an error notification without crashing.
- **FR-015**: System MUST parse and index the CC-CEDICT dictionary at plugin load time for fast lookups.

### Key Entities

- **Dictionary Entry**: Represents a single CC-CEDICT record containing Traditional form, Simplified form, pinyin, and one or more English definitions.
- **Lookup Result**: The resolved dictionary entry (or entries) matching the character(s) at the cursor position, including both single-character and compound word matches.
- **Plugin Settings**: User-configurable preferences including trigger mode (hover/manual), visible popup fields, and style overrides.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can look up any Chinese character present in CC-CEDICT and see its definition within 1 second of triggering the lookup.
- **SC-002**: The plugin functions fully without an internet connection after initial installation.
- **SC-003**: 100% of CC-CEDICT entries are searchable by both Traditional and Simplified character forms.
- **SC-004**: Users can switch between hover and manual selection modes without restarting Obsidian — via either settings UI or command palette commands.
- **SC-005**: The popup is visually consistent with the active Obsidian theme (inherits theme colors and fonts).
- **SC-006**: Users can customize popup content (toggle fields on/off) and see changes reflected immediately on the next lookup.

## Assumptions

- The CC-CEDICT dictionary file will be bundled with the plugin distribution, so users do not need to download it separately. The dictionary is frozen per release and not user-replaceable, enabling future build-time optimizations on the fixed file.
- The CC-CEDICT format is stable and well-documented (Traditional Simplified [pinyin] /definition1/definition2/).
- The plugin targets Obsidian's desktop and mobile platforms that support the standard Plugin API.
- Popup positioning follows standard Obsidian tooltip/popover behavior (near cursor, within viewport bounds).
- "Hover" mode uses Obsidian's editor hover/mouseover events; "manual selection" mode uses text selection events. On mobile, the plugin auto-falls back to tap-to-select since hover is unavailable.
- Font size and basic style overrides are sufficient for popup customization; full CSS customization is not required.

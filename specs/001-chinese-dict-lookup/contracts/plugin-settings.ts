/**
 * Plugin Settings Contract
 *
 * Defines the public settings interface exposed to users via Obsidian's
 * settings tab. Changes to these fields affect popup behavior and display.
 */

export type TriggerMode = 'hover' | 'selection';

export interface HanziPluginSettings {
  /** How dictionary lookups are triggered. Default: 'hover' */
  triggerMode: TriggerMode;

  /** Show Traditional Chinese characters in popup. Default: true */
  showTraditional: boolean;

  /** Show Simplified Chinese characters in popup. Default: true */
  showSimplified: boolean;

  /** Show pinyin pronunciation in popup. Default: true */
  showPinyin: boolean;

  /** Show English definitions in popup. Default: true */
  showDefinitions: boolean;

  /** Font size (px) for popup content. Range: [8, 32]. Default: 14 */
  popupFontSize: number;

  /** Max characters to scan ahead for longest-match. Range: [1, 12]. Default: 8 */
  maxLookAhead: number;
}

export const DEFAULT_SETTINGS: HanziPluginSettings = {
  triggerMode: 'hover',
  showTraditional: true,
  showSimplified: true,
  showPinyin: true,
  showDefinitions: true,
  popupFontSize: 12,
  maxLookAhead: 8,
};

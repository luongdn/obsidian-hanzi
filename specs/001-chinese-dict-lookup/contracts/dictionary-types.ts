/**
 * Dictionary Types Contract
 *
 * Defines the core data types for CC-CEDICT dictionary parsing,
 * indexing, and lookup results.
 */

/** A single parsed CC-CEDICT dictionary record. */
export interface DictionaryEntry {
  /** Traditional Chinese form (e.g., "學") */
  traditional: string;

  /** Simplified Chinese form (e.g., "学") */
  simplified: string;

  /** Pinyin with tone marks (e.g., "xué") */
  pinyin: string;

  /** Original pinyin with tone numbers (e.g., "xue2") */
  pinyinRaw: string;

  /** English definitions, one per CC-CEDICT slash-delimited segment */
  definitions: string[];
}

/** Lookup result returned by the dictionary engine. */
export interface LookupResult {
  /** The matched text from the document */
  word: string;

  /** All dictionary entries matching the word */
  entries: DictionaryEntry[];

  /** Whether matched as exact selection or via longest-match algorithm */
  matchType: 'exact' | 'longest';
}

/**
 * Dual-map dictionary index optimized for memory efficiency.
 *
 * Primary map keyed by Simplified form (~120K keys).
 * Redirect map for Traditional→Simplified (~76K entries, only where forms differ).
 *
 * Lookup path: primary.get(key) ?? primary.get(redirect.get(key))
 */
export interface DictionaryIndex {
  /**
   * Look up entries by character string.
   * Accepts both Traditional and Simplified forms — Traditional keys are
   * resolved internally via the redirect map.
   */
  lookup(key: string): DictionaryEntry[] | undefined;

  /** Check if an entry exists for the given key (Traditional or Simplified). */
  has(key: string): boolean;

  /** Number of unique keys in the primary (Simplified) map. */
  readonly size: number;
}

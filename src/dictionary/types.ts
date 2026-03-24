export interface DictionaryEntry {
  traditional: string;
  simplified: string;
  pinyin: string;
  pinyinRaw: string;
  definitions: string[];
}

export interface LookupResult {
  word: string;
  entries: DictionaryEntry[];
  matchType: 'exact' | 'longest';
}

export interface DictionaryIndex {
  lookup(key: string): DictionaryEntry[] | undefined;
  has(key: string): boolean;
  readonly size: number;
}

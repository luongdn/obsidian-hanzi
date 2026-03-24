import { DictionaryEntry, DictionaryIndex } from './types';
import { parseDictionary } from './parser';

export class DictionaryIndexImpl implements DictionaryIndex {
  private entries: Map<string, DictionaryEntry[]>;
  private tradToSimp: Map<string, string>;

  constructor(content: string) {
    this.entries = new Map();
    this.tradToSimp = new Map();
    this.build(parseDictionary(content));
  }

  private build(parsed: DictionaryEntry[]): void {
    for (const entry of parsed) {
      const { simplified, traditional } = entry;
      const existing = this.entries.get(simplified);
      if (existing) {
        existing.push(entry);
      } else {
        this.entries.set(simplified, [entry]);
      }

      if (traditional !== simplified) {
        this.tradToSimp.set(traditional, simplified);
      }
    }
  }

  lookup(key: string): DictionaryEntry[] | undefined {
    return (
      this.entries.get(key) ??
      this.entries.get(this.tradToSimp.get(key) ?? '')
    );
  }

  has(key: string): boolean {
    return this.entries.has(key) || this.tradToSimp.has(key);
  }

  get size(): number {
    return this.entries.size;
  }
}

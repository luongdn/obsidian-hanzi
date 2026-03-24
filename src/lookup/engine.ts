import { DictionaryIndex, LookupResult } from '../dictionary/types';
import { isCJK } from './detector';

export function lookupText(
  text: string,
  index: DictionaryIndex,
  maxLookAhead = 8
): LookupResult | undefined {
  if (!text || !isCJK(text[0])) return undefined;

  const limit = Math.min(maxLookAhead, text.length);

  for (let len = limit; len >= 1; len--) {
    const candidate = text.slice(0, len);
    const entries = index.lookup(candidate);
    if (entries && entries.length > 0) {
      return {
        word: candidate,
        entries,
        matchType: len === text.length ? 'exact' : 'longest',
      };
    }
  }

  return undefined;
}

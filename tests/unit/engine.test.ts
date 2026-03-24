import { describe, it, expect, beforeAll } from 'vitest';
import { lookupText } from '../../src/lookup/engine';
import { DictionaryIndexImpl } from '../../src/dictionary/index';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let index: DictionaryIndexImpl;

beforeAll(() => {
  const content = readFileSync(
    resolve(__dirname, '../fixtures/test-dict.u8'),
    'utf-8'
  );
  index = new DictionaryIndexImpl(content);
});

describe('lookup engine', () => {
  it('finds a single-character entry', () => {
    const result = lookupText('人', index);
    expect(result).not.toBeUndefined();
    expect(result?.word).toBe('人');
    expect(result?.entries.length).toBeGreaterThan(0);
  });

  it('prefers longest match over single char', () => {
    const result = lookupText('你好啊', index);
    expect(result?.word).toBe('你好');
  });

  it('returns undefined when no match', () => {
    const result = lookupText('zzz', index);
    expect(result).toBeUndefined();
  });

  it('returns undefined for non-CJK input', () => {
    const result = lookupText('hello', index);
    expect(result).toBeUndefined();
  });

  it('returns all entries for homographs', () => {
    const result = lookupText('乐', index);
    expect(result).not.toBeUndefined();
    expect(result?.entries.length).toBe(2);
  });

  it('respects maxLookAhead limit', () => {
    const result = lookupText('你好啊', index, 1);
    expect(result?.word).toBe('你');
  });

  it('handles Traditional character lookup', () => {
    const result = lookupText('學', index);
    expect(result).not.toBeUndefined();
    expect(result?.entries[0].simplified).toBe('学');
  });
});

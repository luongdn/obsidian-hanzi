import { describe, it, expect, beforeAll } from 'vitest';
import { parseLine, parseDictionary } from '../../src/dictionary/parser';
import { DictionaryEntry } from '../../src/dictionary/types';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('parseLine', () => {
  it('parses a simple entry', () => {
    const entry = parseLine('學 学 [xue2] /to learn/to study/');
    expect(entry).not.toBeNull();
    expect(entry?.traditional).toBe('學');
    expect(entry?.simplified).toBe('学');
    expect(entry?.pinyinRaw).toBe('xue2');
    expect(entry?.definitions).toEqual(['to learn', 'to study']);
  });

  it('parses multi-character entry', () => {
    const entry = parseLine('你好 你好 [ni3 hao3] /Hello!/Hi!/How are you?/');
    expect(entry).not.toBeNull();
    expect(entry?.traditional).toBe('你好');
    expect(entry?.simplified).toBe('你好');
    expect(entry?.pinyinRaw).toBe('ni3 hao3');
    expect(entry?.definitions).toContain('Hello!');
  });

  it('skips comment lines', () => {
    expect(parseLine('# This is a comment')).toBeNull();
  });

  it('skips empty lines', () => {
    expect(parseLine('')).toBeNull();
    expect(parseLine('   ')).toBeNull();
  });

  it('skips malformed lines', () => {
    expect(parseLine('not a valid line')).toBeNull();
    expect(parseLine('Traditional [pin1] /def/')).toBeNull();
  });

  it('converts pinyin tone numbers to tone marks', () => {
    const entry = parseLine('學 学 [xue2] /to learn/');
    expect(entry?.pinyin).toBe('xué');
  });

  it('handles u: in pinyin', () => {
    const entry = parseLine('女 女 [nu:3] /woman/female/');
    expect(entry).not.toBeNull();
    expect(entry?.pinyin).toBe('nǚ');
  });

  it('converts pinyin in definitions', () => {
    const entry = parseLine('您 您 [nin2] /old variant of 你[ni3]/');
    expect(entry).not.toBeNull();
    expect(entry?.definitions).toEqual(['old variant of 你[nǐ]']);
  });
});

describe('parseDictionary', () => {
  let entries: DictionaryEntry[];

  beforeAll(() => {
    const content = readFileSync(
      resolve(__dirname, '../fixtures/test-dict.u8'),
      'utf-8'
    );
    entries = parseDictionary(content);
  });

  it('parses fixture file', () => {
    expect(entries.length).toBeGreaterThan(5);
  });

  it('skips all comment lines', () => {
    expect(entries.every((e) => !e.traditional.startsWith('#'))).toBe(true);
  });

  it('includes homograph entries for same simplified form', () => {
    const le = entries.filter((e) => e.simplified === '乐');
    expect(le.length).toBe(2);
  });
});

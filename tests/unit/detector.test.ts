import { describe, it, expect } from 'vitest';
import { isCJK } from '../../src/lookup/detector';

describe('isCJK', () => {
  it('returns true for CJK lower boundary (U+4E00)', () => {
    expect(isCJK('\u4E00')).toBe(true);
  });

  it('returns true for CJK upper boundary (U+9FFF)', () => {
    expect(isCJK('\u9FFF')).toBe(true);
  });

  it('returns true for common CJK characters', () => {
    expect(isCJK('中')).toBe(true);
    expect(isCJK('文')).toBe(true);
    expect(isCJK('学')).toBe(true);
  });

  it('returns false for Latin characters', () => {
    expect(isCJK('a')).toBe(false);
    expect(isCJK('Z')).toBe(false);
  });

  it('returns false for numbers', () => {
    expect(isCJK('1')).toBe(false);
    expect(isCJK('0')).toBe(false);
  });

  it('returns false for Chinese punctuation', () => {
    expect(isCJK('。')).toBe(false);
    expect(isCJK('，')).toBe(false);
    expect(isCJK('！')).toBe(false);
  });

  it('returns false for whitespace', () => {
    expect(isCJK(' ')).toBe(false);
    expect(isCJK('\n')).toBe(false);
  });

  it('returns true for CJK Extension A characters (U+3400..U+4DBF)', () => {
    expect(isCJK('\u3400')).toBe(true);
    expect(isCJK('\u4DBF')).toBe(true);
  });

  it('returns true for CJK Compatibility Ideographs (U+F900..U+FAFF)', () => {
    expect(isCJK('\uF900')).toBe(true);
    expect(isCJK('\uFAFF')).toBe(true);
  });

  it('returns false for just-below Extension A (U+33FF)', () => {
    expect(isCJK('\u33FF')).toBe(false);
  });

  it('returns false for just-above CJK range (U+A000)', () => {
    expect(isCJK('\uA000')).toBe(false);
  });

  it('handles empty string without throwing', () => {
    expect(isCJK('')).toBe(false);
  });
});

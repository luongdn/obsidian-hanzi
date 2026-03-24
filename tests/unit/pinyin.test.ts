import { describe, it, expect } from 'vitest';
import { convertPinyin, convertPinyinInDefinition } from '../../src/dictionary/pinyin';

describe('convertPinyin', () => {
  it('converts tone 1', () => {
    expect(convertPinyin('ma1')).toBe('mā');
  });

  it('converts tone 2', () => {
    expect(convertPinyin('ma2')).toBe('má');
  });

  it('converts tone 3', () => {
    expect(convertPinyin('ma3')).toBe('mǎ');
  });

  it('converts tone 4', () => {
    expect(convertPinyin('ma4')).toBe('mà');
  });

  it('converts tone 5 (neutral, no mark)', () => {
    expect(convertPinyin('ma5')).toBe('ma');
  });

  it('converts u: to ü', () => {
    expect(convertPinyin('nu:3')).toBe('nǚ');
    expect(convertPinyin('lu:4')).toBe('lǜ');
  });

  it('converts multi-syllable pinyin', () => {
    expect(convertPinyin('ni3 hao3')).toBe('nǐ hǎo');
    expect(convertPinyin('Zhong1 guo2')).toBe('zhōng guó');
  });

  it('places tone on correct vowel in compound vowels', () => {
    expect(convertPinyin('xue2')).toBe('xué');
    expect(convertPinyin('gui4')).toBe('guì');
  });

  it('places tone on last vowel when no priority vowel', () => {
    expect(convertPinyin('gui4')).toBe('guì');
  });

  it('handles "ou" — tone on o', () => {
    expect(convertPinyin('gou3')).toBe('gǒu');
  });
});

describe('convertPinyinInDefinition', () => {
  it('converts single bracketed pinyin', () => {
    expect(convertPinyinInDefinition('old variant of 您[nin2]')).toBe(
      'old variant of 您[nín]'
    );
  });

  it('converts multiple bracketed pinyin in one string', () => {
    expect(
      convertPinyinInDefinition('see 東西[dong1 xi1] and 你[ni3]')
    ).toBe('see 東西[dōng xī] and 你[nǐ]');
  });

  it('leaves text without bracketed pinyin unchanged', () => {
    expect(convertPinyinInDefinition('to learn')).toBe('to learn');
  });

  it('leaves non-pinyin brackets unchanged', () => {
    expect(convertPinyinInDefinition('see [ABC]')).toBe('see [ABC]');
  });

  it('handles u: in bracketed pinyin', () => {
    expect(convertPinyinInDefinition('female [nu:3]')).toBe('female [nǚ]');
  });
});

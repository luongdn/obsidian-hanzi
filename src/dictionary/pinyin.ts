const TONE_MARKS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
};

function applyTone(syllable: string, tone: number): string {
  const s = syllable.replace('u:', 'ü');
  const idx = tone - 1;

  if (s.includes('a')) return s.replace('a', TONE_MARKS['a'][idx]);
  if (s.includes('e')) return s.replace('e', TONE_MARKS['e'][idx]);
  if (s.includes('ou')) return s.replace('o', TONE_MARKS['o'][idx]);

  for (let i = s.length - 1; i >= 0; i--) {
    const c = s[i];
    if (TONE_MARKS[c]) {
      return s.slice(0, i) + TONE_MARKS[c][idx] + s.slice(i + 1);
    }
  }
  return s;
}

export function convertPinyin(pinyinRaw: string): string {
  return pinyinRaw
    .split(' ')
    .map((syllable) => {
      const match = syllable.match(/^([a-züA-ZÜ:]+)([1-5])$/);
      if (!match) return syllable;
      const [, base, toneStr] = match;
      return applyTone(base.toLowerCase(), parseInt(toneStr, 10));
    })
    .join(' ');
}

export function convertPinyinInDefinition(definition: string): string {
  return definition.replace(
    /\[([a-züA-ZÜ:]+[1-5](?:\s+[a-züA-ZÜ:]+[1-5])*)\]/g,
    (_, pinyinGroup: string) => `[${convertPinyin(pinyinGroup)}]`
  );
}

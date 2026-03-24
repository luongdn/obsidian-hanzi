import { DictionaryEntry } from './types';
import { convertPinyin, convertPinyinInDefinition } from './pinyin';

const LINE_REGEX = /^(.+?)\s(.+?)\s\[(.+?)\]\s\/(.+)\/$/;

export function parseLine(line: string): DictionaryEntry | null {
  if (line.startsWith('#') || line.trim() === '') return null;

  const match = line.match(LINE_REGEX);
  if (!match) return null;

  const [, traditional, simplified, pinyinRaw, defStr] = match;

  if (!traditional || !simplified || !pinyinRaw || !defStr) return null;

  const definitions = defStr
    .split('/')
    .filter((d) => d.trim() !== '')
    .map(convertPinyinInDefinition);
  if (definitions.length === 0) return null;

  return {
    traditional,
    simplified,
    pinyin: convertPinyin(pinyinRaw),
    pinyinRaw,
    definitions,
  };
}

export function parseDictionary(content: string): DictionaryEntry[] {
  const entries: DictionaryEntry[] = [];
  for (const line of content.split(/\r?\n/)) {
    const entry = parseLine(line);
    if (entry) entries.push(entry);
  }
  return entries;
}

// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { Platform } from 'obsidian';
import { ReadingModeHandler } from '../../src/editor/reading-mode';
import { DictionaryIndexImpl } from '../../src/dictionary/index';
import { DEFAULT_SETTINGS } from '../../src/settings';
import type { HanziPluginSettings } from '../../src/settings';
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

function makeSettings(overrides: Partial<HanziPluginSettings> = {}): HanziPluginSettings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

describe('ReadingModeHandler', () => {
  let container: HTMLElement;
  let handler: ReadingModeHandler;

  afterEach(() => {
    handler?.detach();
    document.querySelectorAll('.hanzi-popup').forEach((el) => el.remove());
  });

  describe('hover mode', () => {
    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    it('attaches mousemove listener in hover mode', () => {
      const spy = vi.spyOn(container, 'addEventListener');
      handler = new ReadingModeHandler(index, () => makeSettings({ triggerMode: 'hover' }));
      handler.attach(container);
      expect(spy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    });

    it('does not attach selectionchange in hover mode', () => {
      const spy = vi.spyOn(document, 'addEventListener');
      handler = new ReadingModeHandler(index, () => makeSettings({ triggerMode: 'hover' }));
      handler.attach(container);
      const selectionCalls = spy.mock.calls.filter(([event]) => event === 'selectionchange');
      expect(selectionCalls).toHaveLength(0);
      spy.mockRestore();
    });
  });

  describe('selection mode', () => {
    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    it('attaches selectionchange listener in selection mode', () => {
      const spy = vi.spyOn(document, 'addEventListener');
      handler = new ReadingModeHandler(index, () => makeSettings({ triggerMode: 'selection' }));
      handler.attach(container);
      const selectionCalls = spy.mock.calls.filter(([event]) => event === 'selectionchange');
      expect(selectionCalls).toHaveLength(1);
      spy.mockRestore();
    });

    it('does not attach mousemove in selection mode', () => {
      const spy = vi.spyOn(container, 'addEventListener');
      handler = new ReadingModeHandler(index, () => makeSettings({ triggerMode: 'selection' }));
      handler.attach(container);
      const moveCalls = spy.mock.calls.filter(([event]) => event === 'mousemove');
      expect(moveCalls).toHaveLength(0);
    });

    it('shows popup when CJK text is selected within container', () => {
      const textNode = document.createTextNode('你好世界');
      container.appendChild(textNode);

      handler = new ReadingModeHandler(index, () => makeSettings({ triggerMode: 'selection' }));
      handler.attach(container);

      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, 1);
      const sel = document.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);

      document.dispatchEvent(new Event('selectionchange'));

      const popup = document.querySelector('.hanzi-popup');
      expect(popup).not.toBeNull();
    });

    it('does not show popup for non-CJK selection', () => {
      const textNode = document.createTextNode('hello world');
      container.appendChild(textNode);

      handler = new ReadingModeHandler(index, () => makeSettings({ triggerMode: 'selection' }));
      handler.attach(container);

      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, 5);
      const sel = document.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);

      document.dispatchEvent(new Event('selectionchange'));

      const popup = document.querySelector('.hanzi-popup');
      expect(popup).toBeNull();
    });

    it('does not show popup for selection outside container', () => {
      const outside = document.createElement('div');
      const textNode = document.createTextNode('你好');
      outside.appendChild(textNode);
      document.body.appendChild(outside);

      handler = new ReadingModeHandler(index, () => makeSettings({ triggerMode: 'selection' }));
      handler.attach(container);

      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, 1);
      const sel = document.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);

      document.dispatchEvent(new Event('selectionchange'));

      const popup = document.querySelector('.hanzi-popup');
      expect(popup).toBeNull();

      outside.remove();
    });

    it('dismisses popup when selection collapses', () => {
      const textNode = document.createTextNode('你好世界');
      container.appendChild(textNode);

      handler = new ReadingModeHandler(index, () => makeSettings({ triggerMode: 'selection' }));
      handler.attach(container);

      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, 1);
      const sel = document.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));

      expect(document.querySelector('.hanzi-popup')).not.toBeNull();

      sel.removeAllRanges();
      document.dispatchEvent(new Event('selectionchange'));

      expect(document.querySelector('.hanzi-popup')).toBeNull();
    });

    it('cleans up selectionchange listener on detach', () => {
      const spy = vi.spyOn(document, 'removeEventListener');
      handler = new ReadingModeHandler(index, () => makeSettings({ triggerMode: 'selection' }));
      handler.attach(container);
      handler.detach();
      const selectionCalls = spy.mock.calls.filter(([event]) => event === 'selectionchange');
      expect(selectionCalls).toHaveLength(1);
      spy.mockRestore();
    });
  });

  describe('mobile override', () => {
    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      (Platform as { isMobile: boolean }).isMobile = true;
    });

    afterEach(() => {
      container.remove();
      (Platform as { isMobile: boolean }).isMobile = false;
    });

    it('uses selection mode on mobile even when hover is configured', () => {
      const docSpy = vi.spyOn(document, 'addEventListener');
      const containerSpy = vi.spyOn(container, 'addEventListener');
      handler = new ReadingModeHandler(index, () => makeSettings({ triggerMode: 'hover' }));
      handler.attach(container);

      const selectionCalls = docSpy.mock.calls.filter(([event]) => event === 'selectionchange');
      expect(selectionCalls).toHaveLength(1);

      const moveCalls = containerSpy.mock.calls.filter(([event]) => event === 'mousemove');
      expect(moveCalls).toHaveLength(0);

      docSpy.mockRestore();
    });
  });
});

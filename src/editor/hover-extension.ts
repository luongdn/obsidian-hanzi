import { hoverTooltip, Tooltip, EditorView } from '@codemirror/view';
import { DictionaryIndex } from '../dictionary/types';
import { HanziPluginSettings } from '../settings';
import { isCJK } from '../lookup/detector';
import { lookupText } from '../lookup/engine';
import { createPopupEl } from '../ui/popup';
import { setHighlight, clearHighlight } from '../ui/highlight';

export function createHoverExtension(
  index: DictionaryIndex,
  getSettings: () => HanziPluginSettings
) {
  return hoverTooltip(
    (view: EditorView, pos: number): Tooltip | null => {
      const doc = view.state.doc;
      const char = doc.sliceString(pos, pos + 1);
      if (!char || !isCJK(char)) return null;

      const settings = getSettings();
      const ahead = doc.sliceString(pos, pos + settings.maxLookAhead);
      const result = lookupText(ahead, index, settings.maxLookAhead);
      if (!result) return null;

      const end = pos + result.word.length;

      return {
        pos,
        end,
        above: true,
        create(view: EditorView) {
          const dom = createPopupEl(result, settings);
          requestAnimationFrame(() => {
            view.dispatch({
              effects: setHighlight.of({ from: pos, to: end }),
            });
          });
          return {
            dom,
            destroy() {
              try {
                view.dispatch({ effects: clearHighlight.of() });
              } catch {
                // view may be destroyed
              }
            },
          };
        },
      };
    },
    { hoverTime: 300 }
  );
}

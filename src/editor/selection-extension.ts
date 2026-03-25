import { EditorView, ViewUpdate, Tooltip, showTooltip } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { DictionaryIndex } from '../dictionary/types';
import { HanziPluginSettings } from '../settings';
import { isCJK } from '../lookup/detector';
import { lookupText } from '../lookup/engine';
import { createPopupEl } from '../ui/popup';
import { setHighlight, clearHighlight } from '../ui/highlight';

const setSelectionTooltip = StateEffect.define<Tooltip | null>();

const selectionTooltipField = StateField.define<readonly Tooltip[]>({
  create() {
    return [];
  },
  update(tooltips, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setSelectionTooltip)) {
        return effect.value ? [effect.value] : [];
      }
    }
    return tooltips;
  },
  provide(f) {
    return showTooltip.computeN([f], (state) => state.field(f));
  },
});

export function createSelectionExtension(
  index: DictionaryIndex,
  getSettings: () => HanziPluginSettings
) {
  return [
    selectionTooltipField,
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (!update.selectionSet) return;

      const selection = update.state.selection.main;
      const settings = getSettings();

      if (!selection.empty) {
        const text = update.state.doc.sliceString(
          selection.from,
          selection.to
        );
        if (!text || !isCJK(text[0])) {
          update.view.dispatch({
            effects: [
              setSelectionTooltip.of(null),
              clearHighlight.of(),
            ],
          });
          return;
        }

        const result = lookupText(text, index, settings.maxLookAhead);
        if (!result) {
          update.view.dispatch({
            effects: [
              setSelectionTooltip.of(null),
              clearHighlight.of(),
            ],
          });
          return;
        }

        const from = selection.from;
        const to = selection.from + result.word.length;
        const dom = createPopupEl(result, settings);

        update.view.dispatch({
          effects: [
            setSelectionTooltip.of({
              pos: from,
              end: to,
              above: true,
              create: () => ({ dom }),
            }),
            setHighlight.of({ from, to }),
          ],
        });
      } else {
        update.view.dispatch({
          effects: [
            setSelectionTooltip.of(null),
            clearHighlight.of(),
          ],
        });
      }
    }),
  ];
}

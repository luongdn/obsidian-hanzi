import {
  StateField,
  StateEffect,
  Range,
} from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
} from '@codemirror/view';

export const setHighlight = StateEffect.define<{ from: number; to: number }>();
export const clearHighlight = StateEffect.define<void>();

const highlightMark = Decoration.mark({ class: 'hanzi-highlight' });

export const highlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setHighlight)) {
        const { from, to } = effect.value;
        const deco: Range<Decoration>[] = [highlightMark.range(from, to)];
        decorations = Decoration.set(deco);
      } else if (effect.is(clearHighlight)) {
        decorations = Decoration.none;
      }
    }
    return decorations;
  },
  provide(f) {
    return EditorView.decorations.from(f);
  },
});

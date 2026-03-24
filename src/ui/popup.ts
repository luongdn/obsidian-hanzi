import { LookupResult } from '../dictionary/types';
import { HanziPluginSettings } from '../settings';

export function createPopupEl(
  result: LookupResult,
  settings: HanziPluginSettings
): HTMLElement {
  const popup = document.createElement('div');
  popup.classList.add('hanzi-popup');
  popup.style.fontSize = `${settings.popupFontSize}px`;

  for (const entry of result.entries) {
    const entryEl = document.createElement('div');
    entryEl.classList.add('hanzi-popup-entry');

    if (settings.showTraditional || settings.showSimplified) {
      const charsEl = document.createElement('div');
      charsEl.classList.add('hanzi-popup-chars');

      if (settings.showSimplified) {
        const simpEl = document.createElement('span');
        simpEl.classList.add('hanzi-popup-simplified');
        simpEl.textContent = entry.simplified;
        charsEl.appendChild(simpEl);
      }

      if (
        settings.showTraditional &&
        entry.traditional !== entry.simplified
      ) {
        const tradEl = document.createElement('span');
        tradEl.classList.add('hanzi-popup-traditional');
        tradEl.textContent = entry.traditional;
        charsEl.appendChild(tradEl);
      }

      entryEl.appendChild(charsEl);
    }

    if (settings.showPinyin) {
      const pinyinEl = document.createElement('div');
      pinyinEl.classList.add('hanzi-popup-pinyin');
      pinyinEl.textContent = entry.pinyin;
      entryEl.appendChild(pinyinEl);
    }

    if (settings.showDefinitions) {
      const defsEl = document.createElement('ul');
      defsEl.classList.add('hanzi-popup-definitions');
      for (const def of entry.definitions) {
        const li = document.createElement('li');
        li.textContent = def;
        defsEl.appendChild(li);
      }
      entryEl.appendChild(defsEl);
    }

    popup.appendChild(entryEl);
  }

  return popup;
}

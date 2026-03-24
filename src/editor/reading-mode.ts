import { DictionaryIndex } from '../dictionary/types';
import { HanziPluginSettings } from '../settings';
import { isCJK } from '../lookup/detector';
import { lookupText } from '../lookup/engine';
import { createPopupEl } from '../ui/popup';

export class ReadingModeHandler {
  private popup: HTMLElement | null = null;
  private highlightSpan: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private boundMousemove: (e: MouseEvent) => void;
  private boundDismiss: (e: MouseEvent) => void;
  private boundSelectionChange: () => void;
  private pendingDismissCleanup: (() => void) | null = null;
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private isOverPopup = false;
  private isOverHighlight = false;

  constructor(
    private index: DictionaryIndex,
    private getSettings: () => HanziPluginSettings
  ) {
    this.boundMousemove = this.onMousemove.bind(this);
    this.boundDismiss = this.onDismiss.bind(this);
    this.boundSelectionChange = this.onSelectionChange.bind(this);
  }

  attach(container: HTMLElement): void {
    this.container = container;
    const mode = this.getSettings().triggerMode;
    if (mode === 'selection') {
      document.addEventListener('selectionchange', this.boundSelectionChange);
    } else {
      container.addEventListener('mousemove', this.boundMousemove);
    }
  }

  detach(): void {
    this.container?.removeEventListener('mousemove', this.boundMousemove);
    document.removeEventListener('selectionchange', this.boundSelectionChange);
    this.cancelHoverTimer();
    this.pendingDismissCleanup?.();
    this.dismissPopup();
    this.container = null;
  }

  private cancelHoverTimer(): void {
    if (this.hoverTimer !== null) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  private onMousemove(e: MouseEvent): void {
    this.cancelHoverTimer();

    const clientX = e.clientX;
    const clientY = e.clientY;

    this.hoverTimer = setTimeout(() => {
      this.hoverTimer = null;
      this.performHoverLookup(clientX, clientY);
    }, 50);
  }

  private onSelectionChange(): void {
    const sel = document.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      this.dismissPopup();
      return;
    }

    const range = sel.getRangeAt(0);
    if (!this.container?.contains(range.commonAncestorContainer)) return;

    const text = sel.toString().trim();
    if (!text || !isCJK(text[0])) {
      this.dismissPopup();
      return;
    }

    const settings = this.getSettings();
    const result = lookupText(text, this.index, settings.maxLookAhead);
    if (!result) {
      this.dismissPopup();
      return;
    }

    this.dismissPopup();

    const rect = typeof range.getBoundingClientRect === 'function'
      ? range.getBoundingClientRect()
      : null;
    const popup = createPopupEl(result, settings);
    popup.style.position = 'fixed';
    popup.style.left = `${rect?.left ?? 0}px`;
    popup.style.top = `${(rect?.bottom ?? 0) + 4}px`;
    popup.style.zIndex = '1000';

    document.body.appendChild(popup);
    this.popup = popup;
  }

  private caretAt(clientX: number, clientY: number): { node: Node; offset: number } | null {
    if ('caretPositionFromPoint' in document) {
      const pos = (document as Document & { caretPositionFromPoint(x: number, y: number): { offsetNode: Node; offset: number } | null }).caretPositionFromPoint(clientX, clientY);
      if (!pos) return null;
      return { node: pos.offsetNode, offset: pos.offset };
    }
    if ('caretRangeFromPoint' in document) {
      const range = (document as Document & { caretRangeFromPoint(x: number, y: number): Range | null }).caretRangeFromPoint(clientX, clientY);
      if (!range) return null;
      return { node: range.startContainer, offset: range.startOffset };
    }
    return null;
  }

  private performHoverLookup(clientX: number, clientY: number): void {
    const caret = this.caretAt(clientX, clientY);
    if (!caret) return;

    const textNode = caret.node;
    if (textNode.nodeType !== Node.TEXT_NODE) return;

    const offset = caret.offset;
    const text = textNode.textContent ?? '';
    const char = text[offset];
    if (!char || !isCJK(char)) return;

    const settings = this.getSettings();
    const ahead = text.slice(offset, offset + settings.maxLookAhead);
    const result = lookupText(ahead, this.index, settings.maxLookAhead);
    if (!result) return;

    this.dismissPopup();

    const matchedRange = document.createRange();
    matchedRange.setStart(textNode, offset);
    matchedRange.setEnd(textNode, offset + result.word.length);

    const span = document.createElement('span');
    span.classList.add('hanzi-highlight');
    try {
      matchedRange.surroundContents(span);
      this.highlightSpan = span;
    } catch {
      // ignore DOM range errors
    }

    const popup = createPopupEl(result, settings);
    popup.style.position = 'fixed';
    popup.style.left = `${clientX + 8}px`;
    popup.style.top = `${clientY + 8}px`;
    popup.style.zIndex = '1000';

    this.isOverPopup = false;
    this.isOverHighlight = true;

    popup.addEventListener('mouseenter', () => {
      this.isOverPopup = true;
    });
    popup.addEventListener('mouseleave', () => {
      this.isOverPopup = false;
      this.scheduleDismiss();
    });

    if (this.highlightSpan) {
      this.highlightSpan.addEventListener('mouseenter', () => {
        this.isOverHighlight = true;
      });
      this.highlightSpan.addEventListener('mouseleave', () => {
        this.isOverHighlight = false;
        this.scheduleDismiss();
      });
    }

    document.body.appendChild(popup);
    this.popup = popup;

    document.addEventListener('click', this.boundDismiss, { once: true });
    this.pendingDismissCleanup = () => {
      document.removeEventListener('click', this.boundDismiss);
      this.pendingDismissCleanup = null;
    };
  }

  private scheduleDismiss(): void {
    setTimeout(() => {
      if (!this.isOverPopup && !this.isOverHighlight) {
        this.dismissPopup();
      }
    }, 50);
  }

  private onDismiss(): void {
    this.pendingDismissCleanup = null;
    this.dismissPopup();
  }

  private dismissPopup(): void {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
    if (this.highlightSpan) {
      const parent = this.highlightSpan.parentNode;
      if (parent) {
        while (this.highlightSpan.firstChild) {
          parent.insertBefore(this.highlightSpan.firstChild, this.highlightSpan);
        }
        parent.removeChild(this.highlightSpan);
        (parent as Element).normalize?.();
      }
      this.highlightSpan = null;
    }
    this.isOverPopup = false;
    this.isOverHighlight = false;
  }
}

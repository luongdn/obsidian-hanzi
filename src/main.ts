import { Notice, Platform, Plugin, normalizePath } from 'obsidian';
import { Extension } from '@codemirror/state';
import { DictionaryIndex } from './dictionary/types';
import { DictionaryIndexImpl } from './dictionary/index';
import {
  DEFAULT_SETTINGS,
  HanziPluginSettings,
  HanziSettingTab,
} from './settings';
import { highlightField } from './ui/highlight';
import { createHoverExtension } from './editor/hover-extension';
import { createSelectionExtension } from './editor/selection-extension';
import { ReadingModeHandler } from './editor/reading-mode';

export default class HanziPlugin extends Plugin {
  settings!: HanziPluginSettings;
  private dictIndex: DictionaryIndex | null = null;
  private editorExtensions: Extension[] = [];
  private readingModeHandler: ReadingModeHandler | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new HanziSettingTab(this.app, this));

    try {
      const dir = this.manifest.dir ?? '';
      const dictPath = normalizePath(`${dir}/assets/cedict_ts.u8`);
      const content = await this.app.vault.adapter.read(dictPath);
      this.dictIndex = new DictionaryIndexImpl(content);
      console.log(`[Hanzi] Dictionary loaded: ${this.dictIndex.size} entries`);
    } catch (e) {
      new Notice(
        'Obsidian Hanzi: Failed to load dictionary. Lookups will not be available.'
      );
      return;
    }

    console.log('[Hanzi] Plugin loaded successfully');
    this.registerEditorExtensions();
    this.registerReadingMode();
    this.registerCommands();
  }

  onunload(): void {
    this.readingModeHandler?.detach();
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshExtensions();
    this.refreshReadingMode();
  }

  private async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }

  private buildModeExtension(): Extension {
    const index = this.dictIndex!;
    const getSettings = () => this.settings;
    const triggerMode = Platform.isMobile ? 'selection' : this.settings.triggerMode;
    return triggerMode === 'selection'
      ? createSelectionExtension(index, getSettings)
      : createHoverExtension(index, getSettings);
  }

  private registerEditorExtensions(): void {
    if (!this.dictIndex) return;
    this.editorExtensions = [highlightField, this.buildModeExtension()].flat();
    this.registerEditorExtension(this.editorExtensions);
  }

  private registerReadingMode(): void {
    if (!this.dictIndex) return;

    const getSettings = () => this.settings;
    this.readingModeHandler = new ReadingModeHandler(this.dictIndex, getSettings);

    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        this.readingModeHandler?.detach();
        const readingViews = document.querySelectorAll<HTMLElement>(
          '.markdown-reading-view'
        );
        readingViews.forEach((view) => this.readingModeHandler?.attach(view));
      })
    );
  }

  private registerCommands(): void {
    this.addCommand({
      id: 'use-hover-mode',
      name: 'Use hover mode',
      callback: async () => {
        this.settings.triggerMode = 'hover';
        await this.saveSettings();
        new Notice(Platform.isMobile
          ? 'Hanzi: Switched to hover mode (mobile always uses selection)'
          : 'Hanzi: Switched to hover mode');
      },
    });

    this.addCommand({
      id: 'use-selection-mode',
      name: 'Use selection mode',
      callback: async () => {
        this.settings.triggerMode = 'selection';
        await this.saveSettings();
        new Notice('Hanzi: Switched to selection mode');
      },
    });
  }

  private refreshExtensions(): void {
    if (!this.dictIndex) return;
    const newExtensions = [highlightField, this.buildModeExtension()].flat();
    this.editorExtensions.length = 0;
    newExtensions.forEach((ext) => this.editorExtensions.push(ext));
    this.app.workspace.updateOptions();
  }

  private refreshReadingMode(): void {
    if (!this.dictIndex) return;
    this.readingModeHandler?.detach();
    const getSettings = () => this.settings;
    this.readingModeHandler = new ReadingModeHandler(this.dictIndex, getSettings);
    const readingViews = document.querySelectorAll<HTMLElement>(
      '.markdown-reading-view'
    );
    readingViews.forEach((view) => this.readingModeHandler?.attach(view));
  }
}

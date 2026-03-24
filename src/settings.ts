import { App, PluginSettingTab, Setting } from 'obsidian';
import type HanziPlugin from './main';

export type TriggerMode = 'hover' | 'selection';

export interface HanziPluginSettings {
  triggerMode: TriggerMode;
  showTraditional: boolean;
  showSimplified: boolean;
  showPinyin: boolean;
  showDefinitions: boolean;
  toneColoredPinyin: boolean;
  popupFontSize: number;
  maxLookAhead: number;
}

export const DEFAULT_SETTINGS: HanziPluginSettings = {
  triggerMode: 'hover',
  showTraditional: true,
  showSimplified: true,
  showPinyin: true,
  showDefinitions: true,
  toneColoredPinyin: true,
  popupFontSize: 12,
  maxLookAhead: 8,
};

export class HanziSettingTab extends PluginSettingTab {
  plugin: HanziPlugin;

  constructor(app: App, plugin: HanziPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Trigger mode')
      .setDesc('How dictionary lookups are triggered')
      .addDropdown((drop) =>
        drop
          .addOption('hover', 'Hover')
          .addOption('selection', 'Manual selection')
          .setValue(this.plugin.settings.triggerMode)
          .onChange(async (value) => {
            this.plugin.settings.triggerMode = value as TriggerMode;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Show Traditional characters')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTraditional)
          .onChange(async (value) => {
            this.plugin.settings.showTraditional = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Show Simplified characters')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showSimplified)
          .onChange(async (value) => {
            this.plugin.settings.showSimplified = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Show pinyin')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showPinyin)
          .onChange(async (value) => {
            this.plugin.settings.showPinyin = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Show definitions')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showDefinitions)
          .onChange(async (value) => {
            this.plugin.settings.showDefinitions = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Tone-colored pinyin')
      .setDesc('Color pinyin syllables by tone (Pleco color scheme)')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.toneColoredPinyin)
          .onChange(async (value) => {
            this.plugin.settings.toneColoredPinyin = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Popup font size')
      .setDesc('Font size in pixels (8–32)')
      .addSlider((slider) =>
        slider
          .setLimits(8, 32, 1)
          .setValue(this.plugin.settings.popupFontSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.popupFontSize = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Max look-ahead')
      .setDesc('Max characters to scan for longest match (1–12)')
      .addSlider((slider) =>
        slider
          .setLimits(1, 12, 1)
          .setValue(this.plugin.settings.maxLookAhead)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxLookAhead = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

export class App {}
export class Plugin {}
export class PluginSettingTab {
  containerEl = document.createElement('div');
  constructor(_app: unknown, _plugin: unknown) {}
  display() {}
}
export class Setting {
  constructor(_el: unknown) {}
  setName() { return this; }
  setDesc() { return this; }
  addDropdown() { return this; }
  addToggle() { return this; }
  addSlider() { return this; }
}
export class Notice {
  constructor(_message: string) {}
}
export const Platform = { isMobile: false };
export function normalizePath(p: string) { return p; }

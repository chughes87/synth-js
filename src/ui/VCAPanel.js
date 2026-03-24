import { BasePanel } from './BasePanel.js';

export class VCAPanel extends BasePanel {
  constructor(vcaModule) {
    super(vcaModule);
    this.bindSlider('vca-gain', 'gain', v => v.toFixed(2));
  }
}

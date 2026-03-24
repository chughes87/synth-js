import { BasePanel } from './BasePanel.js';

export class VCAPanel extends BasePanel {
  constructor(vcaModule, container) {
    super(vcaModule, container);
    this.setTitle('VCA');
    this.createSlider('Gain', 'gain', {
      min: 0, max: 1, value: 1, step: 0.01,
      format: v => v.toFixed(2),
    });
  }
}

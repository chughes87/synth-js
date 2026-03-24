import { BasePanel } from './BasePanel.js';

export class OutputPanel extends BasePanel {
  constructor(outputModule, container) {
    super(outputModule, container);
    this.setTitle('Output');
    this.createSlider('Volume', 'volume', {
      min: 0, max: 1, value: 0.5, step: 0.01,
      format: v => v.toFixed(2),
    });
  }
}

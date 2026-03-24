import { BasePanel } from './BasePanel.js';

export class DelayPanel extends BasePanel {
  constructor(delayModule, container) {
    super(delayModule, container);
    this.setTitle('Delay');
    this.createSlider('Time', 'delayTime', {
      min: 0.01, max: 1.5, value: 0.3, step: 0.01,
      format: v => `${v.toFixed(2)} s`,
    });
    this.createSlider('Feedback', 'feedback', {
      min: 0, max: 0.95, value: 0.3, step: 0.01,
      format: v => v.toFixed(2),
    });
  }
}

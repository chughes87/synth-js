import { BasePanel } from './BasePanel.js';

export class DelayPanel extends BasePanel {
  constructor(delayModule) {
    super(delayModule);
    this.bindSlider('delay-time', 'delayTime', v => `${v.toFixed(2)} s`);
    this.bindSlider('delay-feedback', 'feedback', v => v.toFixed(2));
  }
}

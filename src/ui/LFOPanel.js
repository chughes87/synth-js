import { BasePanel } from './BasePanel.js';

export class LFOPanel extends BasePanel {
  constructor(lfoModule) {
    super(lfoModule);
    this.bindSlider('lfo-rate', 'rate', v => `${v.toFixed(1)} Hz`);
    this.bindSlider('lfo-depth', 'depth', v => `${v}`);
    this.bindSelect('lfo-type', 'type');
  }
}

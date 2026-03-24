import { BasePanel } from './BasePanel.js';

export class EnvelopePanel extends BasePanel {
  constructor(envelopeModule) {
    super(envelopeModule);
    this.bindSlider('env-attack', 'attack', v => `${v} s`);
    this.bindSlider('env-decay', 'decay', v => `${v} s`);
    this.bindSlider('env-sustain', 'sustain', v => v.toFixed(2));
    this.bindSlider('env-release', 'releaseTime', v => `${v} s`);
  }
}

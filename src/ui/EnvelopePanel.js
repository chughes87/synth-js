import { BasePanel } from './BasePanel.js';

export class EnvelopePanel extends BasePanel {
  constructor(envelopeModule, container, instanceId) {
    super(envelopeModule, container, instanceId);
    this.setTitle('Envelope');
    this.createSlider('Attack', 'attack', {
      min: 0.001, max: 1, value: 0.01, step: 0.001,
      format: v => `${v} s`,
    });
    this.createSlider('Decay', 'decay', {
      min: 0.01, max: 1, value: 0.1, step: 0.01,
      format: v => `${v} s`,
    });
    this.createSlider('Sustain', 'sustain', {
      min: 0, max: 1, value: 0.7, step: 0.01,
      format: v => v.toFixed(2),
    });
    this.createSlider('Release', 'releaseTime', {
      min: 0.01, max: 2, value: 0.3, step: 0.01,
      format: v => `${v} s`,
    });
  }
}

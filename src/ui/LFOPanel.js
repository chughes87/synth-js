import { BasePanel } from './BasePanel.js';

export class LFOPanel extends BasePanel {
  constructor(lfoModule, container) {
    super(lfoModule, container);
    this.setTitle('LFO');
    this.createSelect('Waveform', 'type', [
      { value: 'sine', label: 'Sine' },
      { value: 'square', label: 'Square' },
      { value: 'sawtooth', label: 'Sawtooth' },
      { value: 'triangle', label: 'Triangle' },
    ]);
    this.createSlider('Rate', 'rate', {
      min: 0.1, max: 30, value: 5, step: 0.1,
      format: v => `${v.toFixed(1)} Hz`,
    });
    this.createSlider('Depth', 'depth', {
      min: 0, max: 500, value: 100, step: 1,
      format: v => `${v}`,
    });
  }
}

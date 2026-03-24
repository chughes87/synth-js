import { BasePanel } from './BasePanel.js';

export class OscillatorPanel extends BasePanel {
  constructor(oscillatorModule, container) {
    super(oscillatorModule, container);
    this.setTitle('Oscillator');
    this.createSlider('Frequency', 'frequency', {
      min: 20, max: 2000, value: 440, step: 1,
      format: v => `${v} Hz`,
    });
    this.createSelect('Waveform', 'type', [
      { value: 'sine', label: 'Sine' },
      { value: 'square', label: 'Square' },
      { value: 'sawtooth', label: 'Sawtooth' },
      { value: 'triangle', label: 'Triangle' },
    ]);
  }
}

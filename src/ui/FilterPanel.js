import { BasePanel } from './BasePanel.js';

export class FilterPanel extends BasePanel {
  constructor(filterModule, container) {
    super(filterModule, container);
    this.setTitle('Filter');
    this.createSelect('Type', 'type', [
      { value: 'lowpass', label: 'Lowpass' },
      { value: 'highpass', label: 'Highpass' },
      { value: 'bandpass', label: 'Bandpass' },
      { value: 'notch', label: 'Notch' },
    ]);
    this.createSlider('Frequency', 'frequency', {
      min: 20, max: 10000, value: 350, step: 1,
      format: v => `${v} Hz`,
    });
    this.createSlider('Q', 'Q', {
      min: 0.1, max: 20, value: 1, step: 0.1,
      format: v => v.toFixed(1),
    });
  }
}

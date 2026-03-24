import { BasePanel } from './BasePanel.js';

/**
 * Binds the oscillator DOM controls to an OscillatorModule.
 */
export class OscillatorPanel extends BasePanel {
  constructor(oscillatorModule) {
    super(oscillatorModule);
    this.bindSlider('osc-frequency', 'frequency', v => `${v} Hz`);
    this.bindSelect('osc-type', 'type');
  }
}

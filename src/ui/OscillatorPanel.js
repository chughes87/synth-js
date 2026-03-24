/**
 * Binds the oscillator DOM controls to an OscillatorModule.
 */
export class OscillatorPanel {
  constructor(oscillatorModule) {
    this.module = oscillatorModule;
    this.frequencySlider = document.getElementById('osc-frequency');
    this.frequencyValue = document.getElementById('osc-frequency-value');
    this.typeSelect = document.getElementById('osc-type');

    this.frequencySlider.addEventListener('input', () => this._onFrequency());
    this.typeSelect.addEventListener('change', () => this._onType());
  }

  _onFrequency() {
    const val = Number(this.frequencySlider.value);
    this.module.frequency = val;
    this.frequencyValue.textContent = `${val} Hz`;
  }

  _onType() {
    this.module.type = this.typeSelect.value;
  }
}

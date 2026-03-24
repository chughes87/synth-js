export class FilterPanel {
  constructor(filterModule) {
    this.module = filterModule;
    this.frequencySlider = document.getElementById('filter-frequency');
    this.frequencyValue = document.getElementById('filter-frequency-value');
    this.qSlider = document.getElementById('filter-q');
    this.qValue = document.getElementById('filter-q-value');
    this.typeSelect = document.getElementById('filter-type');

    this.frequencySlider.addEventListener('input', () => this._onFrequency());
    this.qSlider.addEventListener('input', () => this._onQ());
    this.typeSelect.addEventListener('change', () => this._onType());
  }

  _onFrequency() {
    const val = Number(this.frequencySlider.value);
    this.module.frequency = val;
    this.frequencyValue.textContent = `${val} Hz`;
  }

  _onQ() {
    const val = Number(this.qSlider.value);
    this.module.Q = val;
    this.qValue.textContent = val.toFixed(1);
  }

  _onType() {
    this.module.type = this.typeSelect.value;
  }
}

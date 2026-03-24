export class LFOPanel {
  constructor(lfoModule) {
    this.module = lfoModule;
    this.rateSlider = document.getElementById('lfo-rate');
    this.rateValue = document.getElementById('lfo-rate-value');
    this.depthSlider = document.getElementById('lfo-depth');
    this.depthValue = document.getElementById('lfo-depth-value');
    this.typeSelect = document.getElementById('lfo-type');

    this.rateSlider.addEventListener('input', () => this._onRate());
    this.depthSlider.addEventListener('input', () => this._onDepth());
    this.typeSelect.addEventListener('change', () => this._onType());
  }

  _onRate() {
    const val = Number(this.rateSlider.value);
    this.module.rate = val;
    this.rateValue.textContent = `${val.toFixed(1)} Hz`;
  }

  _onDepth() {
    const val = Number(this.depthSlider.value);
    this.module.depth = val;
    this.depthValue.textContent = val;
  }

  _onType() {
    this.module.type = this.typeSelect.value;
  }
}

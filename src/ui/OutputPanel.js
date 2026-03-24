/**
 * Binds the output DOM controls to an OutputModule.
 */
export class OutputPanel {
  constructor(outputModule) {
    this.module = outputModule;
    this.volumeSlider = document.getElementById('output-volume');
    this.volumeValue = document.getElementById('output-volume-value');

    this.volumeSlider.addEventListener('input', () => this._onVolume());

    // Sync initial volume from slider
    this.module.volume = Number(this.volumeSlider.value);
  }

  _onVolume() {
    const val = Number(this.volumeSlider.value);
    this.module.volume = val;
    this.volumeValue.textContent = val.toFixed(2);
  }
}

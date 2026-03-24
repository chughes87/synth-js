export class EnvelopePanel {
  constructor(envelopeModule) {
    this.module = envelopeModule;
    this.attackSlider = document.getElementById('env-attack');
    this.attackValue = document.getElementById('env-attack-value');
    this.decaySlider = document.getElementById('env-decay');
    this.decayValue = document.getElementById('env-decay-value');
    this.sustainSlider = document.getElementById('env-sustain');
    this.sustainValue = document.getElementById('env-sustain-value');
    this.releaseSlider = document.getElementById('env-release');
    this.releaseValue = document.getElementById('env-release-value');

    this.attackSlider.addEventListener('input', () => this._onAttack());
    this.decaySlider.addEventListener('input', () => this._onDecay());
    this.sustainSlider.addEventListener('input', () => this._onSustain());
    this.releaseSlider.addEventListener('input', () => this._onRelease());
  }

  _onAttack() {
    const val = Number(this.attackSlider.value);
    this.module.attack = val;
    this.attackValue.textContent = `${val} s`;
  }

  _onDecay() {
    const val = Number(this.decaySlider.value);
    this.module.decay = val;
    this.decayValue.textContent = `${val} s`;
  }

  _onSustain() {
    const val = Number(this.sustainSlider.value);
    this.module.sustain = val;
    this.sustainValue.textContent = val.toFixed(2);
  }

  _onRelease() {
    const val = Number(this.releaseSlider.value);
    this.module.releaseTime = val;
    this.releaseValue.textContent = `${val} s`;
  }
}

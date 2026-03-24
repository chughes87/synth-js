/**
 * FilterModule wraps a BiquadFilterNode.
 * Supports lowpass, highpass, bandpass, and notch filter types.
 * Signal passes through: inputNode → filter → outputNode
 */
export class FilterModule {
  constructor(audioContext) {
    this.context = audioContext;
    this._filter = audioContext.createBiquadFilter();
    this.inputNode = this._filter;
    this.outputNode = this._filter;
  }

  get frequency() {
    return this._filter.frequency.value;
  }

  set frequency(value) {
    this._filter.frequency.value = value;
  }

  get Q() {
    return this._filter.Q.value;
  }

  set Q(value) {
    this._filter.Q.value = value;
  }

  get type() {
    return this._filter.type;
  }

  set type(value) {
    this._filter.type = value;
  }

  connect(target) {
    const destination = target.inputNode ?? target;
    this.outputNode.connect(destination);
  }
}

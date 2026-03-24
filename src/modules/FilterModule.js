import { BaseModule } from './BaseModule.js';

/**
 * FilterModule wraps a BiquadFilterNode.
 * Supports lowpass, highpass, bandpass, and notch filter types.
 * Signal passes through: inputNode → filter → outputNode
 */
export class FilterModule extends BaseModule {
  constructor(audioContext) {
    super(audioContext);
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

}

import { BaseModule } from './BaseModule.js';

/**
 * AnalyserModule wraps an AnalyserNode for waveform visualization.
 * Signal flow: inputNode (AnalyserNode) — no output connection needed,
 * it taps the signal in-place for reading time/frequency data.
 */
export class AnalyserModule extends BaseModule {
  constructor(audioContext, { fftSize = 2048 } = {}) {
    super(audioContext);
    this.inputNode = audioContext.createAnalyser();
    this.inputNode.fftSize = fftSize;
    this.outputNode = this.inputNode;
  }

  get fftSize() {
    return this.inputNode.fftSize;
  }

  get bufferLength() {
    return this.inputNode.frequencyBinCount;
  }

  /** Returns a Uint8Array of time-domain waveform data (0–255, 128 = silence). */
  getWaveform() {
    const data = new Uint8Array(this.bufferLength);
    this.inputNode.getByteTimeDomainData(data);
    return data;
  }

  /** Returns a Uint8Array of frequency-domain data (0–255). */
  getFrequencyData() {
    const data = new Uint8Array(this.bufferLength);
    this.inputNode.getByteFrequencyData(data);
    return data;
  }

}

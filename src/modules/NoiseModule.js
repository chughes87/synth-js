import { BaseModule } from './BaseModule.js';

/**
 * NoiseModule generates white noise via an AudioBufferSourceNode.
 * Like OscillatorNode, BufferSourceNode is one-shot — start() recreates it.
 */
export class NoiseModule extends BaseModule {
  constructor(audioContext) {
    super(audioContext);
    this._source = null;
    this._buffer = this._createNoiseBuffer();
    this.outputNode = audioContext.createGain();
  }

  _createNoiseBuffer() {
    const length = this.context.sampleRate * 2;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  get running() {
    return this._source !== null;
  }

  start() {
    if (this._source) {
      return;
    }
    this._source = this.context.createBufferSource();
    this._source.buffer = this._buffer;
    this._source.loop = true;
    this._source.connect(this.outputNode);
    this._source.start();
  }

  stop() {
    if (!this._source) {
      return;
    }
    this._source.stop();
    this._source.disconnect();
    this._source = null;
  }
}

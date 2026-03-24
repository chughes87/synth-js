/**
 * Minimal mock of the Web Audio API AudioContext for testing.
 */

export class AudioParamMock {
  constructor(defaultValue = 0) {
    this.value = defaultValue;
    this._scheduled = [];
  }

  setValueAtTime(value, time) {
    this._scheduled.push({ type: 'setValueAtTime', value, time });
    this.value = value;
  }

  linearRampToValueAtTime(value, time) {
    this._scheduled.push({ type: 'linearRamp', value, time });
    this.value = value;
  }

  exponentialRampToValueAtTime(value, time) {
    this._scheduled.push({ type: 'exponentialRamp', value, time });
    this.value = value;
  }

  cancelScheduledValues(time) {
    this._scheduled = [];
  }
}

export class AudioNodeMock {
  constructor() {
    this._connections = [];
  }

  connect(destination) {
    this._connections.push(destination);
    this._connected = destination;
    return destination;
  }

  disconnect(destination) {
    if (destination === undefined) {
      this._connections = [];
      this._connected = null;
    } else {
      this._connections = this._connections.filter(c => c !== destination);
      this._connected = this._connections[this._connections.length - 1] ?? null;
    }
  }
}

export class GainNodeMock extends AudioNodeMock {
  constructor() {
    super();
    this.gain = new AudioParamMock(1);
  }
}

export class OscillatorNodeMock extends AudioNodeMock {
  constructor() {
    super();
    this.type = 'sine';
    this.frequency = new AudioParamMock(440);
    this.started = false;
    this.stopped = false;
  }

  start() {
    this.started = true;
  }

  stop() {
    this.stopped = true;
  }
}

export class BiquadFilterNodeMock extends AudioNodeMock {
  constructor() {
    super();
    this.type = 'lowpass';
    this.frequency = new AudioParamMock(350);
    this.Q = new AudioParamMock(1);
  }
}

export class DelayNodeMock extends AudioNodeMock {
  constructor(maxDelay = 1) {
    super();
    this.delayTime = new AudioParamMock(0);
    this._maxDelay = maxDelay;
  }
}

export class AudioBufferMock {
  constructor({ length, sampleRate, numberOfChannels = 1 }) {
    this.length = length;
    this.sampleRate = sampleRate;
    this.numberOfChannels = numberOfChannels;
    this._channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      this._channels.push(new Float32Array(length));
    }
  }

  getChannelData(channel) {
    return this._channels[channel];
  }
}

export class AudioBufferSourceNodeMock extends AudioNodeMock {
  constructor() {
    super();
    this.buffer = null;
    this.loop = false;
    this.started = false;
    this.stopped = false;
  }

  start() {
    this.started = true;
  }

  stop() {
    this.stopped = true;
  }
}

export class ConstantSourceNodeMock extends AudioNodeMock {
  constructor() {
    super();
    this.offset = new AudioParamMock(1);
    this.started = false;
    this.stopped = false;
  }

  start() {
    this.started = true;
  }

  stop() {
    this.stopped = true;
  }
}

export class AudioContextMock {
  constructor() {
    this.state = 'suspended';
    this.destination = new AudioNodeMock();
    this.sampleRate = 44100;
    this.currentTime = 0;
  }

  createGain() {
    return new GainNodeMock();
  }

  createOscillator() {
    return new OscillatorNodeMock();
  }

  createBiquadFilter() {
    return new BiquadFilterNodeMock();
  }

  createDelay(maxDelay) {
    return new DelayNodeMock(maxDelay);
  }

  createBuffer(numberOfChannels, length, sampleRate) {
    return new AudioBufferMock({ numberOfChannels, length, sampleRate });
  }

  createBufferSource() {
    return new AudioBufferSourceNodeMock();
  }

  createConstantSource() {
    return new ConstantSourceNodeMock();
  }

  async resume() {
    this.state = 'running';
  }

  async close() {
    this.state = 'closed';
  }
}

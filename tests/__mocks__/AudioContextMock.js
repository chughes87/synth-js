/**
 * Minimal mock of the Web Audio API AudioContext for testing.
 */

export class AudioNodeMock {
  connect(destination) {
    this._connected = destination;
    return destination;
  }

  disconnect() {
    this._connected = null;
  }
}

export class GainNodeMock extends AudioNodeMock {
  constructor() {
    super();
    this.gain = { value: 1 };
  }
}

export class OscillatorNodeMock extends AudioNodeMock {
  constructor() {
    super();
    this.type = 'sine';
    this.frequency = { value: 440 };
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
  }

  createGain() {
    return new GainNodeMock();
  }

  createOscillator() {
    return new OscillatorNodeMock();
  }

  async resume() {
    this.state = 'running';
  }

  async close() {
    this.state = 'closed';
  }
}

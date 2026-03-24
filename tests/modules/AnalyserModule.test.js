import { AnalyserModule } from '../../src/modules/AnalyserModule.js';
import { AudioContextMock, AudioNodeMock } from '../__mocks__/AudioContextMock.js';

// Add createAnalyser to the mock
class AnalyserNodeMock extends AudioNodeMock {
  constructor() {
    super();
    this.fftSize = 2048;
    this.frequencyBinCount = 1024;
  }

  getByteTimeDomainData(array) {
    // Fill with 128 (silence)
    for (let i = 0; i < array.length; i++) {
      array[i] = 128;
    }
  }

  getByteFrequencyData(array) {
    // Fill with 0 (no signal)
    for (let i = 0; i < array.length; i++) {
      array[i] = 0;
    }
  }
}

class AnalyserContextMock extends AudioContextMock {
  createAnalyser() {
    return new AnalyserNodeMock();
  }
}

describe('AnalyserModule', () => {
  let ctx;

  beforeEach(() => {
    ctx = new AnalyserContextMock();
  });

  test('creates an analyser node with default fftSize', () => {
    const analyser = new AnalyserModule(ctx);
    expect(analyser.fftSize).toBe(2048);
    expect(analyser.bufferLength).toBe(1024);
  });

  test('accepts custom fftSize', () => {
    const node = ctx.createAnalyser();
    node.fftSize = 512;
    node.frequencyBinCount = 256;
    // Override createAnalyser to return custom node
    ctx.createAnalyser = () => node;

    const analyser = new AnalyserModule(ctx, { fftSize: 512 });
    expect(analyser.inputNode.fftSize).toBe(512);
  });

  test('inputNode and outputNode are the same node', () => {
    const analyser = new AnalyserModule(ctx);
    expect(analyser.inputNode).toBe(analyser.outputNode);
  });

  test('getWaveform returns Uint8Array of correct length', () => {
    const analyser = new AnalyserModule(ctx);
    const data = analyser.getWaveform();
    expect(data).toBeInstanceOf(Uint8Array);
    expect(data.length).toBe(1024);
    // Mock fills with 128 (silence)
    expect(data[0]).toBe(128);
  });

  test('getFrequencyData returns Uint8Array of correct length', () => {
    const analyser = new AnalyserModule(ctx);
    const data = analyser.getFrequencyData();
    expect(data).toBeInstanceOf(Uint8Array);
    expect(data.length).toBe(1024);
    expect(data[0]).toBe(0);
  });

  test('connect wires outputNode to target inputNode', () => {
    const analyser = new AnalyserModule(ctx);
    const target = { inputNode: new AudioNodeMock() };
    analyser.connect(target);
    expect(analyser.outputNode._connected).toBe(target.inputNode);
  });

  test('connect works with raw AudioNode', () => {
    const analyser = new AnalyserModule(ctx);
    const rawNode = new AudioNodeMock();
    analyser.connect(rawNode);
    expect(analyser.outputNode._connected).toBe(rawNode);
  });
});

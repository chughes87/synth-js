import { OscillatorModule } from '../../src/modules/OscillatorModule.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

describe('OscillatorModule', () => {
  let ctx;
  let osc;

  beforeEach(() => {
    ctx = new AudioContextMock();
    osc = new OscillatorModule(ctx);
  });

  test('initializes with default frequency and type', () => {
    expect(osc.frequency).toBe(440);
    expect(osc.type).toBe('sine');
  });

  test('is not running initially', () => {
    expect(osc.running).toBe(false);
  });

  test('has a gain node as outputNode', () => {
    expect(osc.outputNode.gain).toBeDefined();
  });

  test('start() creates and starts an oscillator', () => {
    osc.start();
    expect(osc.running).toBe(true);
  });

  test('start() applies current frequency and type', () => {
    osc.frequency = 880;
    osc.type = 'square';
    osc.start();
    expect(osc._oscillator.frequency.value).toBe(880);
    expect(osc._oscillator.type).toBe('square');
  });

  test('start() connects oscillator to outputNode', () => {
    osc.start();
    expect(osc._oscillator._connected).toBe(osc.outputNode);
  });

  test('start() is a no-op if already running', () => {
    osc.start();
    const first = osc._oscillator;
    osc.start();
    expect(osc._oscillator).toBe(first);
  });

  test('stop() stops and clears the oscillator', () => {
    osc.start();
    osc.stop();
    expect(osc.running).toBe(false);
  });

  test('stop() is a no-op if not running', () => {
    osc.stop();
    expect(osc.running).toBe(false);
  });

  test('setting frequency while running updates the oscillator', () => {
    osc.start();
    osc.frequency = 220;
    expect(osc._oscillator.frequency.value).toBe(220);
  });

  test('setting type while running updates the oscillator', () => {
    osc.start();
    osc.type = 'sawtooth';
    expect(osc._oscillator.type).toBe('sawtooth');
  });

  test('can restart after stopping (one-shot recreation)', () => {
    osc.start();
    const first = osc._oscillator;
    osc.stop();
    osc.start();
    expect(osc.running).toBe(true);
    expect(osc._oscillator).not.toBe(first);
  });

  test('connect() wires outputNode to a target', () => {
    const target = ctx.createGain();
    osc.connect(target);
    expect(osc.outputNode._connected).toBe(target);
  });

  test('connect() uses inputNode if target has one', () => {
    const inputNode = ctx.createGain();
    const target = { inputNode };
    osc.connect(target);
    expect(osc.outputNode._connected).toBe(inputNode);
  });
});

import { LFOModule } from '../../src/modules/LFOModule.js';
import { AudioContextMock, AudioParamMock } from '../__mocks__/AudioContextMock.js';

describe('LFOModule', () => {
  let ctx;
  let lfo;

  beforeEach(() => {
    ctx = new AudioContextMock();
    lfo = new LFOModule(ctx);
  });

  test('is not running initially', () => {
    expect(lfo.running).toBe(false);
  });

  test('defaults to rate 5, depth 100, sine type', () => {
    expect(lfo.rate).toBe(5);
    expect(lfo.depth).toBe(100);
    expect(lfo.type).toBe('sine');
  });

  test('start() creates and starts an oscillator', () => {
    lfo.start();
    expect(lfo.running).toBe(true);
  });

  test('start() applies current rate and type', () => {
    lfo.rate = 10;
    lfo.type = 'square';
    lfo.start();
    expect(lfo._oscillator.frequency.value).toBe(10);
    expect(lfo._oscillator.type).toBe('square');
  });

  test('start() is a no-op if already running', () => {
    lfo.start();
    const first = lfo._oscillator;
    lfo.start();
    expect(lfo._oscillator).toBe(first);
  });

  test('stop() stops and clears the oscillator', () => {
    lfo.start();
    lfo.stop();
    expect(lfo.running).toBe(false);
  });

  test('stop() is a no-op if not running', () => {
    lfo.stop();
    expect(lfo.running).toBe(false);
  });

  test('setting rate while running updates the oscillator', () => {
    lfo.start();
    lfo.rate = 20;
    expect(lfo._oscillator.frequency.value).toBe(20);
  });

  test('setting type while running updates the oscillator', () => {
    lfo.start();
    lfo.type = 'triangle';
    expect(lfo._oscillator.type).toBe('triangle');
  });

  test('setting depth updates the depth gain node', () => {
    lfo.depth = 200;
    expect(lfo._depthNode.gain.value).toBe(200);
  });

  test('modulate() connects depth node to an AudioParam', () => {
    const param = new AudioParamMock(440);
    lfo.modulate(param);
    expect(lfo._depthNode._connected).toBe(param);
  });

  test('can restart after stopping', () => {
    lfo.start();
    const first = lfo._oscillator;
    lfo.stop();
    lfo.start();
    expect(lfo.running).toBe(true);
    expect(lfo._oscillator).not.toBe(first);
  });
});

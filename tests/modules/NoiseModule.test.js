import { NoiseModule } from '../../src/modules/NoiseModule.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

describe('NoiseModule', () => {
  let ctx;
  let noise;

  beforeEach(() => {
    ctx = new AudioContextMock();
    noise = new NoiseModule(ctx);
  });

  test('is not running initially', () => {
    expect(noise.running).toBe(false);
  });

  test('has a gain node as outputNode', () => {
    expect(noise.outputNode.gain).toBeDefined();
  });

  test('start() creates and starts a buffer source', () => {
    noise.start();
    expect(noise.running).toBe(true);
  });

  test('start() sets the source to loop', () => {
    noise.start();
    expect(noise._source.loop).toBe(true);
  });

  test('start() connects source to outputNode', () => {
    noise.start();
    expect(noise._source._connected).toBe(noise.outputNode);
  });

  test('start() is a no-op if already running', () => {
    noise.start();
    const first = noise._source;
    noise.start();
    expect(noise._source).toBe(first);
  });

  test('stop() stops and clears the source', () => {
    noise.start();
    noise.stop();
    expect(noise.running).toBe(false);
  });

  test('stop() is a no-op if not running', () => {
    noise.stop();
    expect(noise.running).toBe(false);
  });

  test('can restart after stopping', () => {
    noise.start();
    const first = noise._source;
    noise.stop();
    noise.start();
    expect(noise.running).toBe(true);
    expect(noise._source).not.toBe(first);
  });

  test('connect() wires outputNode to a target', () => {
    const target = ctx.createGain();
    noise.connect(target);
    expect(noise.outputNode._connected).toBe(target);
  });
});

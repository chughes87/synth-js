import { AudioEngine } from '../../src/engine/AudioEngine.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

describe('AudioEngine', () => {
  let ctx;
  let engine;

  beforeEach(() => {
    ctx = new AudioContextMock();
    engine = new AudioEngine(ctx);
  });

  test('wraps the injected AudioContext', () => {
    expect(engine.context).toBe(ctx);
  });

  test('exposes destination from the context', () => {
    expect(engine.destination).toBe(ctx.destination);
  });

  test('state mirrors the context state', () => {
    expect(engine.state).toBe('suspended');
  });

  test('start() resumes a suspended context', async () => {
    await engine.start();
    expect(engine.state).toBe('running');
  });

  test('start() is a no-op if already running', async () => {
    await engine.start();
    // Calling start again should not throw
    await engine.start();
    expect(engine.state).toBe('running');
  });

  test('stop() closes a running context', async () => {
    await engine.start();
    await engine.stop();
    expect(engine.state).toBe('closed');
  });

  test('stop() is a no-op if not running', async () => {
    // Context starts suspended — stop should not throw
    await engine.stop();
    expect(engine.state).toBe('suspended');
  });
});

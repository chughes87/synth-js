import { EnvelopeModule } from '../../src/modules/EnvelopeModule.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

describe('EnvelopeModule', () => {
  let ctx;
  let env;

  beforeEach(() => {
    ctx = new AudioContextMock();
    env = new EnvelopeModule(ctx);
  });

  test('output gain starts at 0 (silent)', () => {
    expect(env._outputNode.gain.value).toBe(0);
  });

  test('has default ADSR values', () => {
    expect(env.attack).toBe(0.01);
    expect(env.decay).toBe(0.1);
    expect(env.sustain).toBe(0.7);
    expect(env.releaseTime).toBe(0.3);
  });

  test('is not running initially', () => {
    expect(env.running).toBe(false);
  });

  test('start() creates ConstantSourceNode and connects to output', () => {
    env.start();
    expect(env.running).toBe(true);
    expect(env._source.started).toBe(true);
    expect(env._source._connections).toContain(env._outputNode);
  });

  test('start() is idempotent', () => {
    env.start();
    const source = env._source;
    env.start();
    expect(env._source).toBe(source);
  });

  test('stop() tears down source', () => {
    env.start();
    env.stop();
    expect(env.running).toBe(false);
    expect(env._source).toBeNull();
  });

  test('stop() is safe when not running', () => {
    expect(() => env.stop()).not.toThrow();
  });

  test('trigger() schedules attack and decay ramps', () => {
    env.trigger();
    const scheduled = env._outputNode.gain._scheduled;
    expect(scheduled.length).toBe(3);
    expect(scheduled[0].type).toBe('setValueAtTime');
    expect(scheduled[0].value).toBe(0);
    expect(scheduled[1].type).toBe('linearRamp');
    expect(scheduled[1].value).toBe(1);
    expect(scheduled[2].type).toBe('linearRamp');
    expect(scheduled[2].value).toBe(env.sustain);
  });

  test('release() schedules ramp to 0', () => {
    env.trigger();
    env._outputNode.gain._scheduled = [];
    env.release();
    const scheduled = env._outputNode.gain._scheduled;
    expect(scheduled.length).toBe(2);
    expect(scheduled[0].type).toBe('setValueAtTime');
    expect(scheduled[1].type).toBe('linearRamp');
    expect(scheduled[1].value).toBe(0);
  });

  test('ADSR values can be changed', () => {
    env.attack = 0.05;
    env.decay = 0.2;
    env.sustain = 0.5;
    env.releaseTime = 0.8;

    env.trigger();
    const scheduled = env._outputNode.gain._scheduled;
    expect(scheduled[1].time).toBe(0.05);
    expect(scheduled[2].time).toBeCloseTo(0.25);
    expect(scheduled[2].value).toBe(0.5);
  });

  test('_outputNode can connect to an AudioParam for modulation', () => {
    const param = ctx.createGain().gain;
    env._outputNode.connect(param);
    expect(env._outputNode._connections).toContain(param);
  });
});

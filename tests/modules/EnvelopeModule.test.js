import { EnvelopeModule } from '../../src/modules/EnvelopeModule.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

describe('EnvelopeModule', () => {
  let ctx;
  let env;

  beforeEach(() => {
    ctx = new AudioContextMock();
    env = new EnvelopeModule(ctx);
  });

  test('gain starts at 0 (silent)', () => {
    expect(env._gain.gain.value).toBe(0);
  });

  test('has default ADSR values', () => {
    expect(env.attack).toBe(0.01);
    expect(env.decay).toBe(0.1);
    expect(env.sustain).toBe(0.7);
    expect(env.releaseTime).toBe(0.3);
  });

  test('inputNode and outputNode are the same GainNode', () => {
    expect(env.inputNode).toBe(env.outputNode);
  });

  test('trigger() schedules attack and decay ramps', () => {
    env.trigger();
    const scheduled = env._gain.gain._scheduled;
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
    env._gain.gain._scheduled = [];
    env.release();
    const scheduled = env._gain.gain._scheduled;
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
    const scheduled = env._gain.gain._scheduled;
    // Attack ramp should target time = attack
    expect(scheduled[1].time).toBe(0.05);
    // Decay ramp should target time = attack + decay
    expect(scheduled[2].time).toBeCloseTo(0.25);
    expect(scheduled[2].value).toBe(0.5);
  });

  test('connect() wires outputNode to a target', () => {
    const target = ctx.createGain();
    env.connect(target);
    expect(env.outputNode._connected).toBe(target);
  });

  test('connect() uses inputNode if target has one', () => {
    const inputNode = ctx.createGain();
    env.connect({ inputNode });
    expect(env.outputNode._connected).toBe(inputNode);
  });
});

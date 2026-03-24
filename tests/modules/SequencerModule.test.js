import { SequencerModule, NOTE_FREQS, NOTE_NAMES } from '../../src/modules/SequencerModule.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

describe('SequencerModule', () => {
  let seq;

  beforeEach(() => {
    seq = new SequencerModule(new AudioContextMock());
  });

  test('initializes with 16 steps', () => {
    expect(seq.steps.length).toBe(16);
  });

  test('steps default to C4', () => {
    expect(seq.steps[0].note).toBe('C4');
    expect(seq.steps[7].note).toBe('C4');
  });

  test('every 4th step is active by default', () => {
    expect(seq.steps[0].active).toBe(true);
    expect(seq.steps[4].active).toBe(true);
    expect(seq.steps[1].active).toBe(false);
  });

  test('is not running initially', () => {
    expect(seq.running).toBe(false);
  });

  test('start() arms the sequencer', () => {
    seq.start();
    expect(seq.running).toBe(true);
    expect(seq.currentStep).toBe(0);
  });

  test('start() is a no-op if already running', () => {
    seq.start();
    seq.tick();
    const step = seq.currentStep;
    seq.start(); // should not reset
    expect(seq.running).toBe(true);
  });

  test('stop() disarms the sequencer', () => {
    seq.start();
    seq.stop();
    expect(seq.running).toBe(false);
  });

  test('tick() is a no-op when not running', () => {
    const calls = [];
    seq.onStep = (i) => calls.push(i);
    seq.tick();
    expect(calls).toHaveLength(0);
  });

  test('tick() advances one step and fires onStep for active steps', () => {
    const calls = [];
    seq.onStep = (i, step) => calls.push({ i, note: step.note });
    seq.start();
    seq.tick(); // step 0 is active
    expect(calls).toEqual([{ i: 0, note: 'C4' }]);
    expect(seq.currentStep).toBe(1);
  });

  test('tick() does not fire onStep for inactive steps', () => {
    const calls = [];
    seq.onStep = (i) => calls.push(i);
    seq.start();
    seq.tick(); // step 0 (active)
    seq.tick(); // step 1 (inactive)
    expect(calls).toEqual([0]);
  });

  test('tick() fires onStepChange for every step', () => {
    const changes = [];
    seq.onStepChange = (i) => changes.push(i);
    seq.start();
    seq.tick();
    seq.tick();
    seq.tick();
    expect(changes).toEqual([0, 1, 2]);
  });

  test('tick() wraps around after last step', () => {
    seq.start();
    for (let i = 0; i < 16; i++) seq.tick();
    expect(seq.currentStep).toBe(0);
  });

  test('start() resets currentStep to 0', () => {
    seq.start();
    seq.tick();
    seq.tick();
    seq.stop();
    seq.start();
    expect(seq.currentStep).toBe(0);
  });

  test('step notes can be changed', () => {
    seq.steps[0].note = 'A4';
    expect(seq.steps[0].note).toBe('A4');
  });

  test('step active state can be toggled', () => {
    seq.steps[1].active = true;
    expect(seq.steps[1].active).toBe(true);
  });

  test('configurable step count', () => {
    const seq8 = new SequencerModule(new AudioContextMock(), { steps: 8 });
    expect(seq8.steps.length).toBe(8);
  });

  test('NOTE_FREQS contains expected frequencies', () => {
    expect(NOTE_FREQS['A4']).toBe(440);
    expect(NOTE_FREQS['C4']).toBeCloseTo(261.63);
  });

  test('NOTE_NAMES has entries', () => {
    expect(NOTE_NAMES.length).toBeGreaterThan(0);
    expect(NOTE_NAMES).toContain('C4');
    expect(NOTE_NAMES).toContain('A4');
  });
});

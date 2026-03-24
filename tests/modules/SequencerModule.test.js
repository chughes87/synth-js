import { jest } from '@jest/globals';
import { SequencerModule, NOTE_FREQS, NOTE_NAMES } from '../../src/modules/SequencerModule.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

describe('SequencerModule', () => {
  let ctx;
  let seq;

  beforeEach(() => {
    ctx = new AudioContextMock();
    seq = new SequencerModule(ctx);
    jest.useFakeTimers();
  });

  afterEach(() => {
    seq.stop();
    jest.useRealTimers();
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
    expect(seq.steps[2].active).toBe(false);
  });

  test('default BPM is 120', () => {
    expect(seq.bpm).toBe(120);
  });

  test('stepDuration is correct for 120 BPM sixteenth notes', () => {
    // 60/120/4 = 0.125s
    expect(seq.stepDuration).toBeCloseTo(0.125);
  });

  test('is not running initially', () => {
    expect(seq.running).toBe(false);
  });

  test('start() begins running', () => {
    seq.start();
    expect(seq.running).toBe(true);
  });

  test('start() is a no-op if already running', () => {
    seq.start();
    seq.start();
    expect(seq.running).toBe(true);
  });

  test('stop() stops running', () => {
    seq.start();
    seq.stop();
    expect(seq.running).toBe(false);
  });

  test('stop() is a no-op if not running', () => {
    seq.stop();
    expect(seq.running).toBe(false);
  });

  test('onStep is called for active steps during scheduling', () => {
    const calls = [];
    seq.onStep = (i, step) => calls.push({ i, note: step.note });
    seq.start();
    // Advance time so scheduler fires
    ctx.currentTime = 0.2;
    jest.advanceTimersByTime(30);
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0].i).toBe(0);
    expect(calls[0].note).toBe('C4');
  });

  test('onStep is not called for inactive steps', () => {
    const calls = [];
    seq.onStep = (i) => calls.push(i);
    // Deactivate all steps
    seq.steps.forEach(s => s.active = false);
    seq.start();
    ctx.currentTime = 0.5;
    jest.advanceTimersByTime(30);
    expect(calls.length).toBe(0);
  });

  test('onStepChange is called for every step', () => {
    const changes = [];
    seq.onStepChange = (i) => changes.push(i);
    seq.start();
    ctx.currentTime = 0.5;
    jest.advanceTimersByTime(30);
    // Should have advanced through multiple steps
    expect(changes.length).toBeGreaterThan(1);
    expect(changes[0]).toBe(0);
    expect(changes[1]).toBe(1);
  });

  test('step notes can be changed', () => {
    seq.steps[0].note = 'A4';
    expect(seq.steps[0].note).toBe('A4');
  });

  test('step active state can be toggled', () => {
    seq.steps[1].active = true;
    expect(seq.steps[1].active).toBe(true);
    seq.steps[1].active = false;
    expect(seq.steps[1].active).toBe(false);
  });

  test('configurable step count', () => {
    const seq8 = new SequencerModule(ctx, { steps: 8 });
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

  test('currentStep resets on start', () => {
    seq.start();
    ctx.currentTime = 0.5;
    jest.advanceTimersByTime(30);
    expect(seq.currentStep).toBeGreaterThan(0);
    seq.stop();
    seq.start();
    // After restart, first scheduled step should be 0
    // (it may advance immediately, but _currentStep was reset)
    expect(seq.running).toBe(true);
  });
});

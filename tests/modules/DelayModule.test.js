import { DelayModule } from '../../src/modules/DelayModule.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

describe('DelayModule', () => {
  let ctx;
  let delay;

  beforeEach(() => {
    ctx = new AudioContextMock();
    delay = new DelayModule(ctx);
  });

  test('defaults to delayTime 0.3', () => {
    expect(delay.delayTime).toBe(0.3);
  });

  test('defaults to feedback 0.3', () => {
    expect(delay.feedback).toBe(0.3);
  });

  test('setting delayTime updates the delay node', () => {
    delay.delayTime = 0.5;
    expect(delay.delayTime).toBe(0.5);
  });

  test('setting feedback updates the gain', () => {
    delay.feedback = 0.6;
    expect(delay.feedback).toBe(0.6);
  });

  test('feedback is clamped to max 0.95', () => {
    delay.feedback = 1.5;
    expect(delay.feedback).toBe(0.95);
  });

  test('feedback is clamped to min 0', () => {
    delay.feedback = -0.5;
    expect(delay.feedback).toBe(0);
  });

  test('has separate inputNode and outputNode', () => {
    expect(delay.inputNode).not.toBe(delay.outputNode);
  });

  test('connect() wires outputNode to a target', () => {
    const target = ctx.createGain();
    delay.connect(target);
    expect(delay.outputNode._connected).toBe(target);
  });

  test('connect() uses inputNode if target has one', () => {
    const inputNode = ctx.createGain();
    delay.connect({ inputNode });
    expect(delay.outputNode._connected).toBe(inputNode);
  });
});

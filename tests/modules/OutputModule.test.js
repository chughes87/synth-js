import { OutputModule } from '../../src/modules/OutputModule.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

describe('OutputModule', () => {
  let ctx;
  let output;

  beforeEach(() => {
    ctx = new AudioContextMock();
    output = new OutputModule(ctx);
  });

  test('has a gain node as inputNode', () => {
    expect(output.inputNode.gain).toBeDefined();
  });

  test('inputNode is connected to context destination', () => {
    expect(output.inputNode._connected).toBe(ctx.destination);
  });

  test('volume defaults to 1', () => {
    expect(output.volume).toBe(1);
  });

  test('setting volume updates the gain value', () => {
    output.volume = 0.5;
    expect(output.volume).toBe(0.5);
  });

  test('volume is clamped to minimum 0', () => {
    output.volume = -0.5;
    expect(output.volume).toBe(0);
  });

  test('volume is clamped to maximum 1', () => {
    output.volume = 1.5;
    expect(output.volume).toBe(1);
  });
});

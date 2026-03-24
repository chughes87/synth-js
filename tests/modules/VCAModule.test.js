import { VCAModule } from '../../src/modules/VCAModule.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

describe('VCAModule', () => {
  let ctx;
  let vca;

  beforeEach(() => {
    ctx = new AudioContextMock();
    vca = new VCAModule(ctx);
  });

  test('gain defaults to 1', () => {
    expect(vca.gain).toBe(1);
  });

  test('inputNode and outputNode are the same GainNode', () => {
    expect(vca.inputNode).toBe(vca.outputNode);
  });

  test('gain setter clamps to [0, 1]', () => {
    vca.gain = 0.5;
    expect(vca.gain).toBe(0.5);
    vca.gain = -0.1;
    expect(vca.gain).toBe(0);
    vca.gain = 1.5;
    expect(vca.gain).toBe(1);
  });

  test('connect() wires outputNode to target inputNode', () => {
    const target = { inputNode: ctx.createGain() };
    vca.connect(target);
    expect(vca.outputNode._connected).toBe(target.inputNode);
  });

  test('gain AudioParam is accessible for modulation', () => {
    expect(vca._gain.gain).toBeDefined();
    expect(vca._gain.gain.value).toBe(1);
  });
});

import { FilterModule } from '../../src/modules/FilterModule.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

describe('FilterModule', () => {
  let ctx;
  let filter;

  beforeEach(() => {
    ctx = new AudioContextMock();
    filter = new FilterModule(ctx);
  });

  test('defaults to lowpass filter type', () => {
    expect(filter.type).toBe('lowpass');
  });

  test('defaults to frequency 350', () => {
    expect(filter.frequency).toBe(350);
  });

  test('defaults to Q of 1', () => {
    expect(filter.Q).toBe(1);
  });

  test('setting type updates the filter', () => {
    filter.type = 'highpass';
    expect(filter.type).toBe('highpass');
  });

  test('setting frequency updates the filter', () => {
    filter.frequency = 1000;
    expect(filter.frequency).toBe(1000);
  });

  test('setting Q updates the filter', () => {
    filter.Q = 5;
    expect(filter.Q).toBe(5);
  });

  test('inputNode and outputNode are the same BiquadFilterNode', () => {
    expect(filter.inputNode).toBe(filter.outputNode);
  });

  test('connect() wires outputNode to a target', () => {
    const target = ctx.createGain();
    filter.connect(target);
    expect(filter.outputNode._connected).toBe(target);
  });

  test('connect() uses inputNode if target has one', () => {
    const inputNode = ctx.createGain();
    filter.connect({ inputNode });
    expect(filter.outputNode._connected).toBe(inputNode);
  });
});

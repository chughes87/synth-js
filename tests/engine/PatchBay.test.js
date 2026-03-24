import { PatchBay, VALID_CONNECTIONS } from '../../src/engine/PatchBay.js';
import { OscillatorModule } from '../../src/modules/OscillatorModule.js';
import { NoiseModule } from '../../src/modules/NoiseModule.js';
import { FilterModule } from '../../src/modules/FilterModule.js';
import { EnvelopeModule } from '../../src/modules/EnvelopeModule.js';
import { DelayModule } from '../../src/modules/DelayModule.js';
import { LFOModule } from '../../src/modules/LFOModule.js';
import { OutputModule } from '../../src/modules/OutputModule.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

function createModules() {
  const ctx = new AudioContextMock();
  return {
    ctx,
    osc: new OscillatorModule(ctx),
    noise: new NoiseModule(ctx),
    filter: new FilterModule(ctx),
    envelope: new EnvelopeModule(ctx),
    delay: new DelayModule(ctx),
    lfo: new LFOModule(ctx),
    output: new OutputModule(ctx),
  };
}

describe('PatchBay', () => {
  let modules, patchBay;

  beforeEach(() => {
    modules = createModules();
    patchBay = new PatchBay(modules);
  });

  describe('connect / disconnect', () => {
    test('audio connect wires outputNode to inputNode', () => {
      patchBay.connect('osc', 'filter');
      expect(modules.osc.outputNode._connections).toContain(modules.filter.inputNode);
    });

    test('audio disconnect removes specific connection', () => {
      patchBay.connect('osc', 'filter');
      patchBay.disconnect('osc', 'filter');
      expect(modules.osc.outputNode._connections).not.toContain(modules.filter.inputNode);
    });

    test('disconnect returns false if not connected', () => {
      expect(patchBay.disconnect('osc', 'filter')).toBe(false);
    });

    test('connect returns true on success', () => {
      expect(patchBay.connect('osc', 'filter')).toBe(true);
    });

    test('connect returns true if already connected (idempotent)', () => {
      patchBay.connect('osc', 'filter');
      expect(patchBay.connect('osc', 'filter')).toBe(true);
      // Should not duplicate the Web Audio connection
      const count = modules.osc.outputNode._connections
        .filter(c => c === modules.filter.inputNode).length;
      expect(count).toBe(1);
    });

    test('connect returns false for invalid connection', () => {
      expect(patchBay.connect('filter', 'filter')).toBe(false);
    });
  });

  describe('multiple sources to one target', () => {
    test('osc and noise can both connect to filter', () => {
      patchBay.connect('osc', 'filter');
      patchBay.connect('noise', 'filter');
      expect(modules.osc.outputNode._connections).toContain(modules.filter.inputNode);
      expect(modules.noise.outputNode._connections).toContain(modules.filter.inputNode);
    });

    test('disconnecting one source preserves the other', () => {
      patchBay.connect('osc', 'filter');
      patchBay.connect('noise', 'filter');
      patchBay.disconnect('osc', 'filter');
      expect(modules.osc.outputNode._connections).not.toContain(modules.filter.inputNode);
      expect(modules.noise.outputNode._connections).toContain(modules.filter.inputNode);
    });
  });

  describe('toggle', () => {
    test('toggle connects and returns true when not connected', () => {
      expect(patchBay.toggle('osc', 'filter')).toBe(true);
      expect(patchBay.isConnected('osc', 'filter')).toBe(true);
    });

    test('toggle disconnects and returns false when already connected', () => {
      patchBay.connect('osc', 'filter');
      expect(patchBay.toggle('osc', 'filter')).toBe(false);
      expect(patchBay.isConnected('osc', 'filter')).toBe(false);
    });
  });

  describe('isConnected', () => {
    test('returns false when not connected', () => {
      expect(patchBay.isConnected('osc', 'filter')).toBe(false);
    });

    test('returns true when connected', () => {
      patchBay.connect('osc', 'filter');
      expect(patchBay.isConnected('osc', 'filter')).toBe(true);
    });

    test('returns false after disconnect', () => {
      patchBay.connect('osc', 'filter');
      patchBay.disconnect('osc', 'filter');
      expect(patchBay.isConnected('osc', 'filter')).toBe(false);
    });
  });

  describe('getConnections', () => {
    test('returns empty array when no connections', () => {
      expect(patchBay.getConnections()).toEqual([]);
    });

    test('returns all active connections', () => {
      patchBay.connect('osc', 'filter');
      patchBay.connect('filter', 'output');
      const conns = patchBay.getConnections();
      expect(conns).toHaveLength(2);
      expect(conns).toContainEqual({ source: 'osc', target: 'filter' });
      expect(conns).toContainEqual({ source: 'filter', target: 'output' });
    });
  });

  describe('modulation connections', () => {
    test('lfo connects to filter.freq AudioParam', () => {
      patchBay.connect('lfo', 'filter.freq');
      expect(modules.lfo._depthNode._connections)
        .toContain(modules.filter._filter.frequency);
    });

    test('lfo disconnects from filter.freq AudioParam', () => {
      patchBay.connect('lfo', 'filter.freq');
      patchBay.disconnect('lfo', 'filter.freq');
      expect(modules.lfo._depthNode._connections)
        .not.toContain(modules.filter._filter.frequency);
    });

    test('lfo connects to filter.q AudioParam', () => {
      patchBay.connect('lfo', 'filter.q');
      expect(modules.lfo._depthNode._connections)
        .toContain(modules.filter._filter.Q);
    });

    test('lfo to osc.freq skips wire when oscillator not started', () => {
      patchBay.connect('lfo', 'osc.freq');
      // Connection is tracked but no Web Audio wire (osc._oscillator is null)
      expect(patchBay.isConnected('lfo', 'osc.freq')).toBe(true);
      expect(modules.lfo._depthNode._connections).toHaveLength(0);
    });

    test('reconnectModulations wires lfo to osc.freq after start', () => {
      patchBay.connect('lfo', 'osc.freq');
      modules.osc.start(); // creates _oscillator
      patchBay.reconnectModulations();
      expect(modules.lfo._depthNode._connections)
        .toContain(modules.osc._oscillator.frequency);
    });
  });

  describe('validity', () => {
    test('rejects self-connections', () => {
      expect(patchBay.connect('filter', 'filter')).toBe(false);
    });

    test('rejects audio source to mod target', () => {
      expect(patchBay.connect('osc', 'osc.freq')).toBe(false);
    });

    test('rejects lfo to audio target', () => {
      expect(patchBay.connect('lfo', 'filter')).toBe(false);
    });

    test('rejects downstream to upstream (feedback)', () => {
      expect(patchBay.connect('output', 'filter')).toBe(false);
      expect(patchBay.connect('delay', 'filter')).toBe(false);
      expect(patchBay.connect('envelope', 'filter')).toBe(false);
    });

    test('all VALID_CONNECTIONS entries are accepted', () => {
      for (const [source, targets] of Object.entries(VALID_CONNECTIONS)) {
        for (const target of targets) {
          expect(patchBay.connect(source, target)).toBe(true);
          patchBay.disconnect(source, target);
        }
      }
    });
  });
});

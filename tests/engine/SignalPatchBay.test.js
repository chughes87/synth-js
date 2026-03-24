import { SignalPatchBay, SIGNAL_CONNECTIONS } from '../../src/engine/SignalPatchBay.js';
import { OscillatorModule } from '../../src/modules/OscillatorModule.js';
import { NoiseModule } from '../../src/modules/NoiseModule.js';
import { FilterModule } from '../../src/modules/FilterModule.js';
import { EnvelopeModule } from '../../src/modules/EnvelopeModule.js';
import { DelayModule } from '../../src/modules/DelayModule.js';
import { LFOModule } from '../../src/modules/LFOModule.js';
import { VCAModule } from '../../src/modules/VCAModule.js';
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
    vca: new VCAModule(ctx),
    delay: new DelayModule(ctx),
    lfo: new LFOModule(ctx),
    output: new OutputModule(ctx),
  };
}

describe('SignalPatchBay', () => {
  let modules, patchBay;

  beforeEach(() => {
    modules = createModules();
    patchBay = new SignalPatchBay(modules);
  });

  describe('audio connect / disconnect', () => {
    test('connect wires outputNode to inputNode', () => {
      patchBay.connect('osc', 'filter');
      expect(modules.osc.outputNode._connections).toContain(modules.filter.inputNode);
    });

    test('disconnect removes specific connection', () => {
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

    test('connect is idempotent', () => {
      patchBay.connect('osc', 'filter');
      expect(patchBay.connect('osc', 'filter')).toBe(true);
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

  describe('VCA audio routing', () => {
    test('osc can connect to vca', () => {
      patchBay.connect('osc', 'vca');
      expect(modules.osc.outputNode._connections).toContain(modules.vca.inputNode);
    });

    test('vca can connect to output', () => {
      patchBay.connect('vca', 'output');
      expect(modules.vca.outputNode._connections).toContain(modules.output.inputNode);
    });

    test('filter can connect to vca', () => {
      patchBay.connect('filter', 'vca');
      expect(patchBay.isConnected('filter', 'vca')).toBe(true);
    });
  });

  describe('toggle', () => {
    test('connects and returns true when not connected', () => {
      expect(patchBay.toggle('osc', 'filter')).toBe(true);
      expect(patchBay.isConnected('osc', 'filter')).toBe(true);
    });

    test('disconnects and returns false when already connected', () => {
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

  describe('disconnectAll', () => {
    test('removes all connections where module is source', () => {
      patchBay.connect('osc', 'filter');
      patchBay.connect('osc', 'vca');
      patchBay.connect('noise', 'filter');
      patchBay.disconnectAll('osc');
      expect(patchBay.getConnections()).toEqual([{ source: 'noise', target: 'filter' }]);
    });

    test('removes all connections where module is target', () => {
      patchBay.connect('osc', 'filter');
      patchBay.connect('noise', 'filter');
      patchBay.connect('osc', 'vca');
      patchBay.disconnectAll('filter');
      expect(patchBay.getConnections()).toEqual([{ source: 'osc', target: 'vca' }]);
    });

    test('unwires audio nodes', () => {
      patchBay.connect('osc', 'filter');
      patchBay.disconnectAll('osc');
      expect(modules.osc.outputNode._connections).not.toContain(modules.filter.inputNode);
    });

    test('no-op for module with no connections', () => {
      patchBay.connect('osc', 'filter');
      patchBay.disconnectAll('delay');
      expect(patchBay.getConnections()).toHaveLength(1);
    });
  });

  describe('validity', () => {
    test('rejects self-connections', () => {
      expect(patchBay.connect('filter', 'filter')).toBe(false);
    });

    test('rejects mod targets', () => {
      expect(patchBay.connect('osc', 'osc.freq')).toBe(false);
    });

    test('rejects mod sources', () => {
      expect(patchBay.connect('lfo', 'filter')).toBe(false);
    });

    test('rejects downstream to upstream (feedback)', () => {
      expect(patchBay.connect('output', 'filter')).toBe(false);
      expect(patchBay.connect('delay', 'filter')).toBe(false);
      expect(patchBay.connect('vca', 'filter')).toBe(false);
    });

    test('all SIGNAL_CONNECTIONS entries are accepted', () => {
      for (const [source, targets] of Object.entries(SIGNAL_CONNECTIONS)) {
        for (const target of targets) {
          expect(patchBay.connect(source, target)).toBe(true);
          patchBay.disconnect(source, target);
        }
      }
    });
  });
});

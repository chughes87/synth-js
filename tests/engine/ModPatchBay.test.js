import { ModPatchBay, MOD_CONNECTIONS } from '../../src/engine/ModPatchBay.js';
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

describe('ModPatchBay', () => {
  let modules, patchBay;

  beforeEach(() => {
    modules = createModules();
    patchBay = new ModPatchBay(modules);
  });

  describe('LFO modulation connections', () => {
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

    test('lfo connects to vca.gain AudioParam', () => {
      patchBay.connect('lfo', 'vca.gain');
      expect(modules.lfo._depthNode._connections)
        .toContain(modules.vca._gain.gain);
    });

    test('lfo to osc.freq skips wire when oscillator not started', () => {
      patchBay.connect('lfo', 'osc.freq');
      expect(patchBay.isConnected('lfo', 'osc.freq')).toBe(true);
      expect(modules.lfo._depthNode._connections).toHaveLength(0);
    });

    test('reconnectModulations wires lfo to osc.freq after start', () => {
      patchBay.connect('lfo', 'osc.freq');
      modules.osc.start();
      patchBay.reconnectModulations();
      expect(modules.lfo._depthNode._connections)
        .toContain(modules.osc._oscillator.frequency);
    });
  });

  describe('envelope modulation connections', () => {
    test('envelope connects to vca.gain AudioParam', () => {
      patchBay.connect('envelope', 'vca.gain');
      expect(modules.envelope._outputNode._connections)
        .toContain(modules.vca._gain.gain);
    });

    test('envelope connects to filter.freq AudioParam', () => {
      patchBay.connect('envelope', 'filter.freq');
      expect(modules.envelope._outputNode._connections)
        .toContain(modules.filter._filter.frequency);
    });

    test('envelope disconnects from vca.gain', () => {
      patchBay.connect('envelope', 'vca.gain');
      patchBay.disconnect('envelope', 'vca.gain');
      expect(modules.envelope._outputNode._connections)
        .not.toContain(modules.vca._gain.gain);
    });

    test('envelope to osc.freq skips wire when oscillator not started', () => {
      patchBay.connect('envelope', 'osc.freq');
      expect(patchBay.isConnected('envelope', 'osc.freq')).toBe(true);
      expect(modules.envelope._outputNode._connections).toHaveLength(0);
    });

    test('reconnectModulations wires envelope to osc.freq after start', () => {
      patchBay.connect('envelope', 'osc.freq');
      modules.osc.start();
      patchBay.reconnectModulations();
      expect(modules.envelope._outputNode._connections)
        .toContain(modules.osc._oscillator.frequency);
    });
  });

  describe('toggle', () => {
    test('connects and returns true when not connected', () => {
      expect(patchBay.toggle('lfo', 'filter.freq')).toBe(true);
      expect(patchBay.isConnected('lfo', 'filter.freq')).toBe(true);
    });

    test('disconnects and returns false when already connected', () => {
      patchBay.connect('lfo', 'filter.freq');
      expect(patchBay.toggle('lfo', 'filter.freq')).toBe(false);
      expect(patchBay.isConnected('lfo', 'filter.freq')).toBe(false);
    });
  });

  describe('getConnections', () => {
    test('returns empty array when no connections', () => {
      expect(patchBay.getConnections()).toEqual([]);
    });

    test('returns all active connections', () => {
      patchBay.connect('lfo', 'filter.freq');
      patchBay.connect('envelope', 'vca.gain');
      const conns = patchBay.getConnections();
      expect(conns).toHaveLength(2);
      expect(conns).toContainEqual({ source: 'lfo', target: 'filter.freq' });
      expect(conns).toContainEqual({ source: 'envelope', target: 'vca.gain' });
    });
  });

  describe('disconnectAll', () => {
    test('removes all connections where module is source', () => {
      patchBay.connect('lfo', 'filter.freq');
      patchBay.connect('lfo', 'vca.gain');
      patchBay.connect('envelope', 'vca.gain');
      patchBay.disconnectAll('lfo');
      expect(patchBay.getConnections()).toEqual([{ source: 'envelope', target: 'vca.gain' }]);
    });

    test('removes all connections targeting a module param', () => {
      patchBay.connect('lfo', 'filter.freq');
      patchBay.connect('lfo', 'filter.q');
      patchBay.connect('envelope', 'vca.gain');
      patchBay.disconnectAll('filter');
      expect(patchBay.getConnections()).toEqual([{ source: 'envelope', target: 'vca.gain' }]);
    });

    test('unwires audio params', () => {
      patchBay.connect('lfo', 'filter.freq');
      patchBay.disconnectAll('filter');
      expect(modules.lfo._depthNode._connections)
        .not.toContain(modules.filter._filter.frequency);
    });

    test('no-op for module with no connections', () => {
      patchBay.connect('lfo', 'filter.freq');
      patchBay.disconnectAll('osc');
      expect(patchBay.getConnections()).toHaveLength(1);
    });
  });

  describe('validity', () => {
    test('rejects audio sources', () => {
      expect(patchBay.connect('osc', 'filter.freq')).toBe(false);
    });

    test('rejects audio targets', () => {
      expect(patchBay.connect('lfo', 'filter')).toBe(false);
    });

    test('all MOD_CONNECTIONS entries are accepted', () => {
      for (const [source, targets] of Object.entries(MOD_CONNECTIONS)) {
        for (const target of targets) {
          expect(patchBay.connect(source, target)).toBe(true);
          patchBay.disconnect(source, target);
        }
      }
    });
  });
});

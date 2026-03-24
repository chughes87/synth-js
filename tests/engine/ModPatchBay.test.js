import { ModPatchBay, MOD_CONNECTIONS } from '../../src/engine/ModPatchBay.js';
import { ModuleRegistry } from '../../src/engine/ModuleRegistry.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

function setup() {
  const registry = new ModuleRegistry(new AudioContextMock());
  const osc1 = registry.create('osc');
  const filter1 = registry.create('filter');
  const vca1 = registry.create('vca');
  const lfo1 = registry.create('lfo');
  const envelope1 = registry.create('envelope');
  return { registry, osc1, filter1, vca1, lfo1, envelope1 };
}

describe('ModPatchBay', () => {
  let s, patchBay;

  beforeEach(() => {
    s = setup();
    patchBay = new ModPatchBay(s.registry);
  });

  describe('LFO modulation connections', () => {
    test('lfo connects to filter.freq AudioParam', () => {
      patchBay.connect('lfo-1', 'filter-1.freq');
      expect(s.lfo1.module.modOutputNode._connections)
        .toContain(s.filter1.module._filter.frequency);
    });

    test('lfo disconnects from filter.freq AudioParam', () => {
      patchBay.connect('lfo-1', 'filter-1.freq');
      patchBay.disconnect('lfo-1', 'filter-1.freq');
      expect(s.lfo1.module.modOutputNode._connections)
        .not.toContain(s.filter1.module._filter.frequency);
    });

    test('lfo connects to filter.q AudioParam', () => {
      patchBay.connect('lfo-1', 'filter-1.q');
      expect(s.lfo1.module.modOutputNode._connections)
        .toContain(s.filter1.module._filter.Q);
    });

    test('lfo connects to vca.gain AudioParam', () => {
      patchBay.connect('lfo-1', 'vca-1.gain');
      expect(s.lfo1.module.modOutputNode._connections)
        .toContain(s.vca1.module._gain.gain);
    });

    test('lfo to osc.freq skips wire when oscillator not started', () => {
      patchBay.connect('lfo-1', 'osc-1.freq');
      expect(patchBay.isConnected('lfo-1', 'osc-1.freq')).toBe(true);
      expect(s.lfo1.module.modOutputNode._connections).toHaveLength(0);
    });

    test('reconnectModulations wires lfo to osc.freq after start', () => {
      patchBay.connect('lfo-1', 'osc-1.freq');
      s.osc1.module.start();
      patchBay.reconnectModulations();
      expect(s.lfo1.module.modOutputNode._connections)
        .toContain(s.osc1.module._oscillator.frequency);
    });
  });

  describe('envelope modulation connections', () => {
    test('envelope connects to vca.gain AudioParam', () => {
      patchBay.connect('envelope-1', 'vca-1.gain');
      expect(s.envelope1.module.modOutputNode._connections)
        .toContain(s.vca1.module._gain.gain);
    });

    test('envelope connects to filter.freq AudioParam', () => {
      patchBay.connect('envelope-1', 'filter-1.freq');
      expect(s.envelope1.module.modOutputNode._connections)
        .toContain(s.filter1.module._filter.frequency);
    });

    test('envelope disconnects from vca.gain', () => {
      patchBay.connect('envelope-1', 'vca-1.gain');
      patchBay.disconnect('envelope-1', 'vca-1.gain');
      expect(s.envelope1.module.modOutputNode._connections)
        .not.toContain(s.vca1.module._gain.gain);
    });
  });

  describe('toggle', () => {
    test('connects and returns true when not connected', () => {
      expect(patchBay.toggle('lfo-1', 'filter-1.freq')).toBe(true);
      expect(patchBay.isConnected('lfo-1', 'filter-1.freq')).toBe(true);
    });

    test('disconnects and returns false when already connected', () => {
      patchBay.connect('lfo-1', 'filter-1.freq');
      expect(patchBay.toggle('lfo-1', 'filter-1.freq')).toBe(false);
      expect(patchBay.isConnected('lfo-1', 'filter-1.freq')).toBe(false);
    });
  });

  describe('getConnections', () => {
    test('returns empty array when no connections', () => {
      expect(patchBay.getConnections()).toEqual([]);
    });

    test('returns all active connections', () => {
      patchBay.connect('lfo-1', 'filter-1.freq');
      patchBay.connect('envelope-1', 'vca-1.gain');
      const conns = patchBay.getConnections();
      expect(conns).toHaveLength(2);
      expect(conns).toContainEqual({ source: 'lfo-1', target: 'filter-1.freq' });
      expect(conns).toContainEqual({ source: 'envelope-1', target: 'vca-1.gain' });
    });
  });

  describe('disconnectAll', () => {
    test('removes all connections where instance is source', () => {
      patchBay.connect('lfo-1', 'filter-1.freq');
      patchBay.connect('lfo-1', 'vca-1.gain');
      patchBay.connect('envelope-1', 'vca-1.gain');
      patchBay.disconnectAll('lfo-1');
      expect(patchBay.getConnections()).toEqual([{ source: 'envelope-1', target: 'vca-1.gain' }]);
    });

    test('removes all connections targeting a module instance', () => {
      patchBay.connect('lfo-1', 'filter-1.freq');
      patchBay.connect('lfo-1', 'filter-1.q');
      patchBay.connect('envelope-1', 'vca-1.gain');
      patchBay.disconnectAll('filter-1');
      expect(patchBay.getConnections()).toEqual([{ source: 'envelope-1', target: 'vca-1.gain' }]);
    });
  });

  describe('validity', () => {
    test('rejects audio sources', () => {
      expect(patchBay.connect('osc-1', 'filter-1.freq')).toBe(false);
    });

    test('rejects invalid param names', () => {
      expect(patchBay.connect('lfo-1', 'filter-1.bogus')).toBe(false);
    });

    test('all MOD_CONNECTIONS type pairs are accepted', () => {
      for (const [sourceType, targets] of Object.entries(MOD_CONNECTIONS)) {
        const source = s.registry.create(sourceType);
        for (const typeTarget of targets) {
          const [targetType, param] = typeTarget.split('.');
          const target = s.registry.create(targetType);
          const targetId = `${target.id}.${param}`;
          expect(patchBay.connect(source.id, targetId)).toBe(true);
          patchBay.disconnect(source.id, targetId);
        }
      }
    });
  });
});

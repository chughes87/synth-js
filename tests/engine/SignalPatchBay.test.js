import { SignalPatchBay, SIGNAL_CONNECTIONS } from '../../src/engine/SignalPatchBay.js';
import { ModuleRegistry } from '../../src/engine/ModuleRegistry.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

function setup() {
  const registry = new ModuleRegistry(new AudioContextMock());
  const osc1 = registry.create('osc');
  const osc2 = registry.create('osc');
  const noise1 = registry.create('noise');
  const filter1 = registry.create('filter');
  const vca1 = registry.create('vca');
  const delay1 = registry.create('delay');
  const output1 = registry.create('output');
  return { registry, osc1, osc2, noise1, filter1, vca1, delay1, output1 };
}

describe('SignalPatchBay', () => {
  let s, patchBay;

  beforeEach(() => {
    s = setup();
    patchBay = new SignalPatchBay(s.registry);
  });

  describe('audio connect / disconnect', () => {
    test('connect wires outputNode to inputNode', () => {
      patchBay.connect('osc-1', 'filter-1');
      expect(s.osc1.module.outputNode._connections).toContain(s.filter1.module.inputNode);
    });

    test('disconnect removes specific connection', () => {
      patchBay.connect('osc-1', 'filter-1');
      patchBay.disconnect('osc-1', 'filter-1');
      expect(s.osc1.module.outputNode._connections).not.toContain(s.filter1.module.inputNode);
    });

    test('disconnect returns false if not connected', () => {
      expect(patchBay.disconnect('osc-1', 'filter-1')).toBe(false);
    });

    test('connect returns true on success', () => {
      expect(patchBay.connect('osc-1', 'filter-1')).toBe(true);
    });

    test('connect is idempotent', () => {
      patchBay.connect('osc-1', 'filter-1');
      expect(patchBay.connect('osc-1', 'filter-1')).toBe(true);
      const count = s.osc1.module.outputNode._connections
        .filter(c => c === s.filter1.module.inputNode).length;
      expect(count).toBe(1);
    });

    test('connect returns false for invalid connection', () => {
      expect(patchBay.connect('filter-1', 'filter-1')).toBe(false);
    });

    test('connect returns false for unknown instance', () => {
      expect(patchBay.connect('osc-99', 'filter-1')).toBe(false);
    });
  });

  describe('multiple instances', () => {
    test('two oscillators can connect to same filter', () => {
      patchBay.connect('osc-1', 'filter-1');
      patchBay.connect('osc-2', 'filter-1');
      expect(s.osc1.module.outputNode._connections).toContain(s.filter1.module.inputNode);
      expect(s.osc2.module.outputNode._connections).toContain(s.filter1.module.inputNode);
    });

    test('disconnecting one osc preserves the other', () => {
      patchBay.connect('osc-1', 'filter-1');
      patchBay.connect('osc-2', 'filter-1');
      patchBay.disconnect('osc-1', 'filter-1');
      expect(s.osc1.module.outputNode._connections).not.toContain(s.filter1.module.inputNode);
      expect(s.osc2.module.outputNode._connections).toContain(s.filter1.module.inputNode);
    });
  });

  describe('toggle', () => {
    test('connects and returns true when not connected', () => {
      expect(patchBay.toggle('osc-1', 'filter-1')).toBe(true);
      expect(patchBay.isConnected('osc-1', 'filter-1')).toBe(true);
    });

    test('disconnects and returns false when already connected', () => {
      patchBay.connect('osc-1', 'filter-1');
      expect(patchBay.toggle('osc-1', 'filter-1')).toBe(false);
      expect(patchBay.isConnected('osc-1', 'filter-1')).toBe(false);
    });
  });

  describe('isConnected / getConnections', () => {
    test('returns false when not connected', () => {
      expect(patchBay.isConnected('osc-1', 'filter-1')).toBe(false);
    });

    test('returns all active connections', () => {
      patchBay.connect('osc-1', 'filter-1');
      patchBay.connect('filter-1', 'output-1');
      const conns = patchBay.getConnections();
      expect(conns).toHaveLength(2);
      expect(conns).toContainEqual({ source: 'osc-1', target: 'filter-1' });
      expect(conns).toContainEqual({ source: 'filter-1', target: 'output-1' });
    });
  });

  describe('disconnectAll', () => {
    test('removes all connections where instance is source', () => {
      patchBay.connect('osc-1', 'filter-1');
      patchBay.connect('osc-1', 'vca-1');
      patchBay.connect('osc-2', 'filter-1');
      patchBay.disconnectAll('osc-1');
      expect(patchBay.getConnections()).toEqual([{ source: 'osc-2', target: 'filter-1' }]);
    });

    test('removes all connections where instance is target', () => {
      patchBay.connect('osc-1', 'filter-1');
      patchBay.connect('osc-2', 'filter-1');
      patchBay.connect('osc-1', 'vca-1');
      patchBay.disconnectAll('filter-1');
      expect(patchBay.getConnections()).toEqual([{ source: 'osc-1', target: 'vca-1' }]);
    });
  });

  describe('validity', () => {
    test('rejects self-connections', () => {
      expect(patchBay.connect('filter-1', 'filter-1')).toBe(false);
    });

    test('rejects mod sources', () => {
      const lfo = s.registry.create('lfo');
      expect(patchBay.connect(lfo.id, 'filter-1')).toBe(false);
    });

    test('rejects downstream to upstream (feedback)', () => {
      expect(patchBay.connect('output-1', 'filter-1')).toBe(false);
      expect(patchBay.connect('vca-1', 'filter-1')).toBe(false);
    });

    test('all SIGNAL_CONNECTIONS type pairs are accepted', () => {
      // Create one of each type to test
      for (const [sourceType, targets] of Object.entries(SIGNAL_CONNECTIONS)) {
        const source = s.registry.create(sourceType);
        for (const targetType of targets) {
          const target = s.registry.create(targetType);
          expect(patchBay.connect(source.id, target.id)).toBe(true);
          patchBay.disconnect(source.id, target.id);
        }
      }
    });
  });
});

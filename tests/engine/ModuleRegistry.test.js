import { ModuleRegistry, typeOf, splitModTarget } from '../../src/engine/ModuleRegistry.js';
import { AudioContextMock } from '../__mocks__/AudioContextMock.js';

describe('typeOf', () => {
  test('extracts type from instance ID', () => {
    expect(typeOf('osc-1')).toBe('osc');
    expect(typeOf('filter-2')).toBe('filter');
    expect(typeOf('envelope-10')).toBe('envelope');
  });
});

describe('splitModTarget', () => {
  test('splits instance ID and param name', () => {
    expect(splitModTarget('filter-1.freq')).toEqual(['filter-1', 'freq']);
    expect(splitModTarget('vca-2.gain')).toEqual(['vca-2', 'gain']);
    expect(splitModTarget('osc-1.freq')).toEqual(['osc-1', 'freq']);
  });
});

describe('ModuleRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new ModuleRegistry(new AudioContextMock());
  });

  test('create returns unique IDs', () => {
    const a = registry.create('osc');
    const b = registry.create('osc');
    expect(a.id).toBe('osc-1');
    expect(b.id).toBe('osc-2');
    expect(a.module).not.toBe(b.module);
  });

  test('create different types get independent counters', () => {
    const osc = registry.create('osc');
    const flt = registry.create('filter');
    expect(osc.id).toBe('osc-1');
    expect(flt.id).toBe('filter-1');
  });

  test('get returns the module', () => {
    const { id, module } = registry.create('osc');
    expect(registry.get(id)).toBe(module);
  });

  test('get returns undefined for unknown ID', () => {
    expect(registry.get('osc-99')).toBeUndefined();
  });

  test('has checks existence', () => {
    const { id } = registry.create('osc');
    expect(registry.has(id)).toBe(true);
    expect(registry.has('osc-99')).toBe(false);
  });

  test('remove deletes the module', () => {
    const { id } = registry.create('osc');
    expect(registry.remove(id)).toBe(true);
    expect(registry.has(id)).toBe(false);
  });

  test('remove returns false for unknown ID', () => {
    expect(registry.remove('osc-99')).toBe(false);
  });

  test('getAll returns all entries', () => {
    registry.create('osc');
    registry.create('filter');
    const all = registry.getAll();
    expect(all).toHaveLength(2);
    expect(all[0][0]).toBe('osc-1');
    expect(all[1][0]).toBe('filter-1');
  });

  test('getByType filters by type', () => {
    registry.create('osc');
    registry.create('osc');
    registry.create('filter');
    const oscs = registry.getByType('osc');
    expect(oscs).toHaveLength(2);
    expect(oscs[0][0]).toBe('osc-1');
    expect(oscs[1][0]).toBe('osc-2');
  });

  test('throws on unknown type', () => {
    expect(() => registry.create('unknown')).toThrow('Unknown module type: unknown');
  });
});

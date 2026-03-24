import { OscillatorModule } from '../modules/OscillatorModule.js';
import { NoiseModule } from '../modules/NoiseModule.js';
import { FilterModule } from '../modules/FilterModule.js';
import { VCAModule } from '../modules/VCAModule.js';
import { DelayModule } from '../modules/DelayModule.js';
import { OutputModule } from '../modules/OutputModule.js';
import { LFOModule } from '../modules/LFOModule.js';
import { EnvelopeModule } from '../modules/EnvelopeModule.js';
import { SequencerModule } from '../modules/SequencerModule.js';
import { TriggerModule } from '../modules/TriggerModule.js';

export const MODULE_TYPES = {
  osc:      { ModuleClass: OscillatorModule, label: 'Oscillator' },
  noise:    { ModuleClass: NoiseModule, label: 'Noise' },
  filter:   { ModuleClass: FilterModule, label: 'Filter' },
  vca:      { ModuleClass: VCAModule, label: 'VCA' },
  delay:    { ModuleClass: DelayModule, label: 'Delay' },
  output:   { ModuleClass: OutputModule, label: 'Output' },
  lfo:      { ModuleClass: LFOModule, label: 'LFO' },
  envelope: { ModuleClass: EnvelopeModule, label: 'Envelope' },
  seq:      { ModuleClass: SequencerModule, label: 'Sequencer' },
  trigger:  { ModuleClass: TriggerModule, label: 'Trigger' },
};

/** Extract module type from an instance ID (e.g. 'osc-1' → 'osc', 'filter-2' → 'filter'). */
export function typeOf(instanceId) {
  return instanceId.replace(/-\d+$/, '');
}

/**
 * Split a mod target ID into instance ID and param name.
 * e.g. 'filter-1.freq' → ['filter-1', 'freq']
 */
export function splitModTarget(targetId) {
  const dotIndex = targetId.lastIndexOf('.');
  return [targetId.slice(0, dotIndex), targetId.slice(dotIndex + 1)];
}

export class ModuleRegistry {
  constructor(audioContext) {
    this._ctx = audioContext;
    this._modules = new Map();
    this._counters = new Map();
  }

  create(type) {
    const config = MODULE_TYPES[type];
    if (!config) throw new Error(`Unknown module type: ${type}`);

    const count = (this._counters.get(type) ?? 0) + 1;
    this._counters.set(type, count);
    const id = `${type}-${count}`;
    const module = new config.ModuleClass(this._ctx);
    this._modules.set(id, module);
    return { id, module };
  }

  remove(id) {
    const module = this._modules.get(id);
    if (!module) return false;
    if (typeof module.stop === 'function') {
      try { module.stop(); } catch (_) { /* may not be running */ }
    }
    this._modules.delete(id);
    return true;
  }

  get(id) {
    return this._modules.get(id);
  }

  has(id) {
    return this._modules.has(id);
  }

  getAll() {
    return [...this._modules.entries()];
  }

  getByType(type) {
    return this.getAll().filter(([id]) => typeOf(id) === type);
  }
}

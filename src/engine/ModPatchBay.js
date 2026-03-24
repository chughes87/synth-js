/**
 * ModPatchBay manages modulation connections (control-rate signals to AudioParams).
 * Uses ModuleRegistry for dynamic lookups. Mod targets use instance-based IDs
 * like 'filter-1.freq' instead of 'filter.freq'.
 */

import { typeOf, splitModTarget } from './ModuleRegistry.js';

const VALID_CONNECTIONS = {
  lfo:      ['osc.freq', 'filter.freq', 'filter.q', 'vca.gain'],
  envelope: ['osc.freq', 'filter.freq', 'filter.q', 'vca.gain'],
  seq:      ['osc.freq', 'filter.freq', 'filter.q', 'vca.gain', 'envelope.trigger'],
  trigger:  ['envelope.trigger', 'seq.start', 'seq.clock', 'clock.start'],
  clock:    ['seq.clock', 'envelope.trigger'],
};

export class ModPatchBay {
  constructor(registry) {
    this._registry = registry;
    this._connections = new Set();
  }

  _key(sourceId, targetId) {
    return `${sourceId}->${targetId}`;
  }

  _isValid(sourceId, targetId) {
    const sourceType = typeOf(sourceId);
    const [targetInstanceId, param] = splitModTarget(targetId);
    const targetType = typeOf(targetInstanceId);
    const typeTarget = `${targetType}.${param}`;
    const allowed = VALID_CONNECTIONS[sourceType];
    return allowed !== undefined && allowed.includes(typeTarget);
  }

  connect(sourceId, targetId) {
    if (!this._isValid(sourceId, targetId)) return false;
    const key = this._key(sourceId, targetId);
    if (this._connections.has(key)) return true;

    this._connections.add(key);
    this._wire(sourceId, targetId);
    return true;
  }

  disconnect(sourceId, targetId) {
    const key = this._key(sourceId, targetId);
    if (!this._connections.has(key)) return false;

    this._connections.delete(key);
    this._unwire(sourceId, targetId);
    return true;
  }

  toggle(sourceId, targetId) {
    if (this.isConnected(sourceId, targetId)) {
      this.disconnect(sourceId, targetId);
      return false;
    } else {
      return this.connect(sourceId, targetId);
    }
  }

  /** Disconnect all connections involving the given instance ID (as source or target module). */
  disconnectAll(instanceId) {
    for (const key of [...this._connections]) {
      const [source, target] = key.split('->');
      const [targetInstanceId] = splitModTarget(target);
      if (source === instanceId || targetInstanceId === instanceId) {
        this.disconnect(source, target);
      }
    }
  }

  isConnected(sourceId, targetId) {
    return this._connections.has(this._key(sourceId, targetId));
  }

  getConnections() {
    return [...this._connections].map(key => {
      const [source, target] = key.split('->');
      return { source, target };
    });
  }

  /** Re-wire all modulation connections (e.g. after osc.start() recreates the OscillatorNode). */
  reconnectModulations() {
    for (const key of this._connections) {
      const [sourceId, targetId] = key.split('->');
      this._wire(sourceId, targetId);
    }
  }

  _wire(sourceId, targetId) {
    const source = this._registry.get(sourceId);
    if (!source?.modOutputNode) return;
    const [targetInstanceId, param] = splitModTarget(targetId);
    const target = this._registry.get(targetInstanceId);
    if (!target) return;
    const audioParam = target.getModParam(param);
    if (audioParam) {
      source.modOutputNode.connect(audioParam);
    }
  }

  _unwire(sourceId, targetId) {
    const source = this._registry.get(sourceId);
    if (!source?.modOutputNode) return;
    const [targetInstanceId, param] = splitModTarget(targetId);
    const target = this._registry.get(targetInstanceId);
    if (!target) return;
    const audioParam = target.getModParam(param);
    if (audioParam) {
      source.modOutputNode.disconnect(audioParam);
    }
  }
}

export { VALID_CONNECTIONS as MOD_CONNECTIONS };

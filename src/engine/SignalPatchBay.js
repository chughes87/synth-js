/**
 * SignalPatchBay manages audio-rate connections between module instances.
 * Uses ModuleRegistry for dynamic lookups and typeOf for validation.
 */

import { typeOf } from './ModuleRegistry.js';

const VALID_CONNECTIONS = {
  osc:    ['filter', 'vca', 'delay', 'output'],
  noise:  ['filter', 'vca', 'delay', 'output'],
  filter: ['vca', 'delay', 'output'],
  vca:    ['delay', 'output'],
  delay:  ['output'],
};

export class SignalPatchBay {
  constructor(registry) {
    this._registry = registry;
    this._connections = new Set();
  }

  _key(sourceId, targetId) {
    return `${sourceId}->${targetId}`;
  }

  _isValid(sourceId, targetId) {
    const sourceType = typeOf(sourceId);
    const targetType = typeOf(targetId);
    const allowed = VALID_CONNECTIONS[sourceType];
    return allowed !== undefined && allowed.includes(targetType);
  }

  connect(sourceId, targetId) {
    if (!this._isValid(sourceId, targetId)) return false;
    const key = this._key(sourceId, targetId);
    if (this._connections.has(key)) return true;

    const source = this._registry.get(sourceId);
    const target = this._registry.get(targetId);
    if (!source || !target) return false;

    this._connections.add(key);
    source.outputNode.connect(target.inputNode);
    return true;
  }

  disconnect(sourceId, targetId) {
    const key = this._key(sourceId, targetId);
    if (!this._connections.has(key)) return false;

    const source = this._registry.get(sourceId);
    const target = this._registry.get(targetId);
    this._connections.delete(key);
    if (source && target) {
      source.outputNode.disconnect(target.inputNode);
    }
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

  /** Disconnect all connections involving the given instance ID. */
  disconnectAll(instanceId) {
    for (const key of [...this._connections]) {
      const [source, target] = key.split('->');
      if (source === instanceId || target === instanceId) {
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
}

export { VALID_CONNECTIONS as SIGNAL_CONNECTIONS };

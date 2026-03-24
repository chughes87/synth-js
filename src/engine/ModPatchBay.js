/**
 * ModPatchBay manages modulation connections (control-rate signals to AudioParams).
 * Handles outputNode.connect(audioParam) routing only.
 */

const VALID_CONNECTIONS = {
  lfo:      ['osc.freq', 'filter.freq', 'filter.q', 'vca.gain'],
  envelope: ['osc.freq', 'filter.freq', 'filter.q', 'vca.gain'],
};

export class ModPatchBay {
  constructor(modules) {
    this._connections = new Set();

    this._sources = {
      lfo: modules.lfo._depthNode,
      envelope: modules.envelope._outputNode,
    };

    this._paramGetters = {
      'osc.freq': () => modules.osc._oscillator?.frequency,
      'filter.freq': () => modules.filter._filter.frequency,
      'filter.q': () => modules.filter._filter.Q,
      'vca.gain': () => modules.vca._gain.gain,
    };
  }

  _key(sourceId, targetId) {
    return `${sourceId}->${targetId}`;
  }

  _isValid(sourceId, targetId) {
    const allowed = VALID_CONNECTIONS[sourceId];
    return allowed !== undefined && allowed.includes(targetId);
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
    const param = this._paramGetters[targetId]();
    if (param) {
      this._sources[sourceId].connect(param);
    }
  }

  _unwire(sourceId, targetId) {
    const param = this._paramGetters[targetId]();
    if (param) {
      this._sources[sourceId].disconnect(param);
    }
  }
}

export { VALID_CONNECTIONS as MOD_CONNECTIONS };

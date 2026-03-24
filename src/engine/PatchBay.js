/**
 * PatchBay manages audio and modulation connections between modules.
 * Replaces hardcoded signal chain with user-routable patching.
 */

const VALID_CONNECTIONS = {
  osc:      ['filter', 'vca', 'delay', 'output'],
  noise:    ['filter', 'vca', 'delay', 'output'],
  filter:   ['vca', 'delay', 'output'],
  vca:      ['delay', 'output'],
  delay:    ['output'],
  lfo:      ['osc.freq', 'filter.freq', 'filter.q', 'vca.gain'],
  envelope: ['osc.freq', 'filter.freq', 'filter.q', 'vca.gain'],
};

export class PatchBay {
  constructor(modules) {
    this._modules = modules;
    this._connections = new Set();

    this._audioSources = {
      osc: modules.osc,
      noise: modules.noise,
      filter: modules.filter,
      vca: modules.vca,
      delay: modules.delay,
    };

    this._audioTargets = {
      filter: modules.filter,
      vca: modules.vca,
      delay: modules.delay,
      output: modules.output,
    };

    this._modSources = {
      lfo: modules.lfo._depthNode,
      envelope: modules.envelope._outputNode,
    };

    this._modParamGetters = {
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

  _isMod(targetId) {
    return targetId in this._modParamGetters;
  }

  _isModSource(sourceId) {
    return sourceId in this._modSources;
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

  /** Re-wire modulation connections after source nodes are recreated (e.g. osc.start()). */
  reconnectModulations() {
    for (const key of this._connections) {
      const [sourceId, targetId] = key.split('->');
      if (this._isMod(targetId)) {
        this._wire(sourceId, targetId);
      }
    }
  }

  _wire(sourceId, targetId) {
    if (this._isMod(targetId)) {
      const param = this._modParamGetters[targetId]();
      if (param) {
        this._modSources[sourceId].connect(param);
      }
    } else {
      const source = this._audioSources[sourceId];
      const target = this._audioTargets[targetId];
      source.outputNode.connect(target.inputNode);
    }
  }

  _unwire(sourceId, targetId) {
    if (this._isMod(targetId)) {
      const param = this._modParamGetters[targetId]();
      if (param) {
        this._modSources[sourceId].disconnect(param);
      }
    } else {
      const source = this._audioSources[sourceId];
      const target = this._audioTargets[targetId];
      source.outputNode.disconnect(target.inputNode);
    }
  }
}

export { VALID_CONNECTIONS };

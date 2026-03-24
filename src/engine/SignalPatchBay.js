/**
 * SignalPatchBay manages audio-rate connections between modules.
 * Handles outputNode.connect(inputNode) routing only.
 */

const VALID_CONNECTIONS = {
  osc:    ['filter', 'vca', 'delay', 'output'],
  noise:  ['filter', 'vca', 'delay', 'output'],
  filter: ['vca', 'delay', 'output'],
  vca:    ['delay', 'output'],
  delay:  ['output'],
};

export class SignalPatchBay {
  constructor(modules) {
    this._connections = new Set();

    this._sources = {
      osc: modules.osc,
      noise: modules.noise,
      filter: modules.filter,
      vca: modules.vca,
      delay: modules.delay,
    };

    this._targets = {
      filter: modules.filter,
      vca: modules.vca,
      delay: modules.delay,
      output: modules.output,
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
    this._sources[sourceId].outputNode.connect(this._targets[targetId].inputNode);
    return true;
  }

  disconnect(sourceId, targetId) {
    const key = this._key(sourceId, targetId);
    if (!this._connections.has(key)) return false;

    this._connections.delete(key);
    this._sources[sourceId].outputNode.disconnect(this._targets[targetId].inputNode);
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
}

export { VALID_CONNECTIONS as SIGNAL_CONNECTIONS };

import { typeOf, splitModTarget } from '../engine/ModuleRegistry.js';
import { NOTE_FREQS } from '../modules/SequencerModule.js';

/**
 * Rack wires transport controls to the engine and modules.
 * Uses the registry to iterate active module instances for start/stop.
 */
export class Rack {
  constructor(engine, registry, activeModules, signalPatchBay, modPatchBay, visualizer) {
    this.engine = engine;
    this._registry = registry;
    this._activeModules = activeModules;
    this.signalPatchBay = signalPatchBay;
    this.modPatchBay = modPatchBay;
    this.visualizer = visualizer;

    this.startBtn = document.getElementById('start-btn');
    this.stopBtn = document.getElementById('stop-btn');

    this._running = false;

    this.startBtn.addEventListener('click', () => this.start());
    this.stopBtn.addEventListener('click', () => this.stop());
  }

  /**
   * Wire a sequencer instance's onStep to trigger connected envelopes.
   * Called from main.js when a sequencer is added.
   */
  wireSequencer(seqId) {
    const seq = this._registry.get(seqId);
    if (!seq) return;

    seq.onStep = (_i, step) => {
      const freq = NOTE_FREQS[step.note] ?? 261.63;

      for (const conn of this.modPatchBay.getConnections()) {
        if (conn.source !== seqId) continue;
        const [targetId, param] = splitModTarget(conn.target);
        const target = this._registry.get(targetId);
        if (!target) continue;

        if (param === 'trigger' && typeof target.trigger === 'function') {
          target.trigger();
        } else if (param === 'freq' && 'frequency' in target) {
          target.frequency = freq;
        }
      }
    };
  }

  _hasSignalConnections(instanceId) {
    return this.signalPatchBay.getConnections().some(c => c.source === instanceId);
  }

  _hasModConnections(instanceId) {
    return this.modPatchBay.getConnections().some(c => c.source === instanceId);
  }

  async start() {
    await this.engine.start();

    for (const id of this._activeModules) {
      const m = this._registry.get(id);
      if (!m) continue;
      const type = typeOf(id);

      if (type === 'osc') {
        m.start();
      } else if (type === 'noise' && this._hasSignalConnections(id)) {
        m.start();
      } else if (type === 'lfo' && this._hasModConnections(id)) {
        m.start();
      } else if (type === 'envelope' && this._hasModConnections(id)) {
        m.start();
        m.trigger();
      }
      // Sequencers are started/stopped via their own panel Play/Stop buttons
    }

    this.modPatchBay.reconnectModulations();
    if (this.visualizer) this.visualizer.start();
    this._running = true;
    this.startBtn.disabled = true;
    this.stopBtn.disabled = false;
  }

  get isRunning() {
    return this._running;
  }

  /** Start a single module instance if appropriate (used when adding modules while running). */
  startModule(id) {
    if (!this._running) return;
    const m = this._registry.get(id);
    if (!m) return;
    const type = typeOf(id);
    if (type === 'osc' && typeof m.start === 'function') {
      m.start();
    }
  }

  /** Called when a connection is toggled while running — starts modules that now need it. */
  onPatchChange() {
    if (!this._running) return;
    for (const id of this._activeModules) {
      const m = this._registry.get(id);
      if (!m || typeof m.start !== 'function') continue;
      const type = typeOf(id);
      if (type === 'noise' && this._hasSignalConnections(id) && !m.running) {
        m.start();
      } else if (type === 'lfo' && this._hasModConnections(id) && !m.running) {
        m.start();
      } else if (type === 'envelope' && this._hasModConnections(id) && !m.running) {
        m.start();
        m.trigger();
      }
    }
    this.modPatchBay.reconnectModulations();
  }

  stop() {
    for (const id of this._activeModules) {
      const m = this._registry.get(id);
      if (!m || typeof m.stop !== 'function') continue;
      const type = typeOf(id);

      if (type === 'envelope' && this._hasModConnections(id)) {
        m.release();
      }
      m.stop();
    }

    if (this.visualizer) this.visualizer.stop();
    this._running = false;
    this.startBtn.disabled = false;
    this.stopBtn.disabled = true;
  }
}

import { NOTE_FREQS } from '../modules/SequencerModule.js';
import { typeOf } from '../engine/ModuleRegistry.js';

/**
 * Rack wires transport controls to the engine and modules.
 * Uses the registry to iterate active module instances for start/stop.
 */
export class Rack {
  constructor(engine, registry, activeModules, signalPatchBay, modPatchBay, sequencer, visualizer) {
    this.engine = engine;
    this._registry = registry;
    this._activeModules = activeModules;
    this.signalPatchBay = signalPatchBay;
    this.modPatchBay = modPatchBay;
    this.sequencer = sequencer;
    this.visualizer = visualizer;

    this.startBtn = document.getElementById('start-btn');
    this.stopBtn = document.getElementById('stop-btn');
    this.seqPlayBtn = document.getElementById('seq-play-btn');
    this.seqStopBtn = document.getElementById('seq-stop-btn');

    this._running = false;

    this.startBtn.addEventListener('click', () => this.start());
    this.stopBtn.addEventListener('click', () => this.stop());
    this.seqPlayBtn.addEventListener('click', () => this.seqPlay());
    this.seqStopBtn.addEventListener('click', () => this.seqStop());

    // Wire sequencer step callback
    this.sequencer.onStep = (i, step) => {
      const freq = NOTE_FREQS[step.note] ?? 261.63;
      // Set frequency on all active oscillators
      for (const id of this._activeModules) {
        if (typeOf(id) === 'osc') {
          const m = this._registry.get(id);
          if (m) m.frequency = freq;
        }
      }
      if (this._hasActiveModType('envelope')) {
        this._forActiveType('envelope', m => m.trigger());
      }
    };
  }

  _hasActiveModType(type) {
    for (const id of this._activeModules) {
      if (typeOf(id) === type) return true;
    }
    return false;
  }

  _forActiveType(type, fn) {
    for (const id of this._activeModules) {
      if (typeOf(id) === type) {
        const m = this._registry.get(id);
        if (m) fn(m, id);
      }
    }
  }

  _isEnvelopePatched() {
    return this.modPatchBay.getConnections().some(c => typeOf(c.source) === 'envelope');
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
    // LFO/envelope/noise will be started when they get connections via onPatchChange
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

    this.sequencer.stop();
    if (this.visualizer) this.visualizer.stop();
    this._running = false;
    this.startBtn.disabled = false;
    this.stopBtn.disabled = true;
    this.seqPlayBtn.disabled = false;
    this.seqStopBtn.disabled = true;
  }

  async seqPlay() {
    await this.engine.start();

    for (const id of this._activeModules) {
      const m = this._registry.get(id);
      if (!m) continue;
      const type = typeOf(id);

      if (type === 'osc' && !m.running) {
        m.start();
      } else if (type === 'lfo' && this._hasModConnections(id) && !m.running) {
        m.start();
      } else if (type === 'envelope' && this._hasModConnections(id) && !m.running) {
        m.start();
      }
    }

    this.modPatchBay.reconnectModulations();
    this.sequencer.start();
    if (this.visualizer) this.visualizer.start();
    this.startBtn.disabled = true;
    this.stopBtn.disabled = false;
    this.seqPlayBtn.disabled = true;
    this.seqStopBtn.disabled = false;
  }

  seqStop() {
    this.sequencer.stop();
    this.seqPlayBtn.disabled = false;
    this.seqStopBtn.disabled = true;
  }
}

import { NOTE_FREQS } from '../modules/SequencerModule.js';

/**
 * Rack wires transport controls to the engine and modules.
 * Uses PatchBay to determine which modules are connected.
 */
export class Rack {
  constructor(engine, modules, patchBay, visualizer) {
    this.engine = engine;
    this.osc = modules.oscillator;
    this.noise = modules.noise;
    this.envelope = modules.envelope;
    this.filter = modules.filter;
    this.delay = modules.delay;
    this.lfo = modules.lfo;
    this.output = modules.output;
    this.sequencer = modules.sequencer;
    this.patchBay = patchBay;
    this.visualizer = visualizer;

    this.startBtn = document.getElementById('start-btn');
    this.stopBtn = document.getElementById('stop-btn');
    this.seqPlayBtn = document.getElementById('seq-play-btn');
    this.seqStopBtn = document.getElementById('seq-stop-btn');

    this.startBtn.addEventListener('click', () => this.start());
    this.stopBtn.addEventListener('click', () => this.stop());
    this.seqPlayBtn.addEventListener('click', () => this.seqPlay());
    this.seqStopBtn.addEventListener('click', () => this.seqStop());

    // Wire sequencer step callback
    this.sequencer.onStep = (i, step) => {
      const freq = NOTE_FREQS[step.note] ?? 261.63;
      this.osc.frequency = freq;
      if (this._isEnvelopeInPath()) {
        this.envelope.trigger();
      }
    };
  }

  _isEnvelopeInPath() {
    return this.patchBay.getConnections().some(c => c.target === 'envelope');
  }

  _hasModConnections() {
    return this.patchBay.getConnections().some(c =>
      c.source === 'lfo' && ['osc.freq', 'filter.freq', 'filter.q'].includes(c.target)
    );
  }

  async start() {
    await this.engine.start();
    this.osc.start();
    if (this.patchBay.getConnections().some(c => c.source === 'noise')) {
      this.noise.start();
    }
    if (this._hasModConnections()) {
      this.lfo.start();
      this.patchBay.reconnectModulations();
    }
    if (this._isEnvelopeInPath()) {
      this.envelope.trigger();
    }
    if (this.visualizer) this.visualizer.start();
    this.startBtn.disabled = true;
    this.stopBtn.disabled = false;
  }

  stop() {
    this.osc.stop();
    this.noise.stop();
    this.lfo.stop();
    this.sequencer.stop();
    if (this._isEnvelopeInPath()) {
      this.envelope.release();
    }
    if (this.visualizer) this.visualizer.stop();
    this.startBtn.disabled = false;
    this.stopBtn.disabled = true;
    this.seqPlayBtn.disabled = false;
    this.seqStopBtn.disabled = true;
  }

  async seqPlay() {
    await this.engine.start();
    if (!this.osc.running) {
      this.osc.start();
    }
    if (this._hasModConnections()) {
      if (!this.lfo.running) this.lfo.start();
      this.patchBay.reconnectModulations();
    }
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

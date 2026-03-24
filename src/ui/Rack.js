import { NOTE_FREQS } from '../modules/SequencerModule.js';

/**
 * Rack wires transport controls to the engine and modules.
 * Uses SignalPatchBay and ModPatchBay to determine which modules are connected.
 */
export class Rack {
  constructor(engine, modules, signalPatchBay, modPatchBay, visualizer) {
    this.engine = engine;
    this.osc = modules.oscillator;
    this.noise = modules.noise;
    this.envelope = modules.envelope;
    this.filter = modules.filter;
    this.vca = modules.vca;
    this.delay = modules.delay;
    this.lfo = modules.lfo;
    this.output = modules.output;
    this.sequencer = modules.sequencer;
    this.signalPatchBay = signalPatchBay;
    this.modPatchBay = modPatchBay;
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
      if (this._isEnvelopePatched()) {
        this.envelope.trigger();
      }
    };
  }

  _isEnvelopePatched() {
    return this.modPatchBay.getConnections().some(c => c.source === 'envelope');
  }

  _hasSignalConnections(sourceId) {
    return this.signalPatchBay.getConnections().some(c => c.source === sourceId);
  }

  _hasModConnections(sourceId) {
    return this.modPatchBay.getConnections().some(c => c.source === sourceId);
  }

  async start() {
    await this.engine.start();
    this.osc.start();
    if (this._hasSignalConnections('noise')) {
      this.noise.start();
    }
    if (this._hasModConnections('lfo')) {
      this.lfo.start();
    }
    if (this._isEnvelopePatched()) {
      this.envelope.start();
      this.envelope.trigger();
    }
    this.modPatchBay.reconnectModulations();
    if (this.visualizer) this.visualizer.start();
    this.startBtn.disabled = true;
    this.stopBtn.disabled = false;
  }

  stop() {
    this.osc.stop();
    this.noise.stop();
    this.lfo.stop();
    this.sequencer.stop();
    if (this._isEnvelopePatched()) {
      this.envelope.release();
    }
    this.envelope.stop();
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
    if (this._hasModConnections('lfo') && !this.lfo.running) {
      this.lfo.start();
    }
    if (this._isEnvelopePatched() && !this.envelope.running) {
      this.envelope.start();
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

import { NOTE_FREQS } from '../modules/SequencerModule.js';

/**
 * Rack wires transport controls and toggle checkboxes to the engine and modules.
 */
export class Rack {
  constructor(engine, modules, visualizer) {
    this.engine = engine;
    this.osc = modules.oscillator;
    this.noise = modules.noise;
    this.envelope = modules.envelope;
    this.filter = modules.filter;
    this.delay = modules.delay;
    this.lfo = modules.lfo;
    this.output = modules.output;
    this.sequencer = modules.sequencer;
    this.visualizer = visualizer;

    this.startBtn = document.getElementById('start-btn');
    this.stopBtn = document.getElementById('stop-btn');
    this.seqPlayBtn = document.getElementById('seq-play-btn');
    this.seqStopBtn = document.getElementById('seq-stop-btn');
    this.noiseCheckbox = document.getElementById('noise-enabled');
    this.envCheckbox = document.getElementById('env-enabled');
    this.delayCheckbox = document.getElementById('delay-enabled');
    this.lfoCheckbox = document.getElementById('lfo-enabled');

    this.startBtn.addEventListener('click', () => this.start());
    this.stopBtn.addEventListener('click', () => this.stop());
    this.seqPlayBtn.addEventListener('click', () => this.seqPlay());
    this.seqStopBtn.addEventListener('click', () => this.seqStop());
    this.noiseCheckbox.addEventListener('change', () => this._toggleNoise());
    this.envCheckbox.addEventListener('change', () => this._rebuildChain());
    this.delayCheckbox.addEventListener('change', () => this._rebuildChain());
    this.lfoCheckbox.addEventListener('change', () => this._toggleLFO());

    // Wire sequencer step callback
    this.sequencer.onStep = (i, step) => {
      const freq = NOTE_FREQS[step.note] ?? 261.63;
      this.osc.frequency = freq;
      if (this.envCheckbox.checked) {
        this.envelope.trigger();
      }
    };
  }

  async start() {
    await this.engine.start();
    this.osc.start();
    if (this.noiseCheckbox.checked) {
      this.noise.start();
    }
    if (this.lfoCheckbox.checked) {
      this.lfo._depthNode.disconnect();
      this.lfo.modulate(this.osc._oscillator.frequency);
      this.lfo.start();
    }
    if (this.envCheckbox.checked) {
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
    if (this.envCheckbox.checked) {
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
    if (this.lfoCheckbox.checked) {
      this.lfo._depthNode.disconnect();
      this.lfo.modulate(this.osc._oscillator.frequency);
      if (!this.lfo.running) this.lfo.start();
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

  _toggleNoise() {
    if (this.noiseCheckbox.checked) {
      this.noise.connect(this.filter);
      if (this.osc.running) {
        this.noise.start();
      }
    } else {
      this.noise.stop();
      this.noise.outputNode.disconnect();
    }
  }

  /** Rebuild the signal chain: filter → [envelope?] → [delay?] → output */
  _rebuildChain() {
    // Disconnect all optional chain nodes
    this.filter.outputNode.disconnect();
    this.envelope.outputNode.disconnect();
    this.delay.outputNode.disconnect();

    // Build chain in order based on current toggle states
    const chain = [this.filter];
    if (this.envCheckbox.checked) chain.push(this.envelope);
    if (this.delayCheckbox.checked) chain.push(this.delay);
    chain.push(this.output);

    for (let i = 0; i < chain.length - 1; i++) {
      chain[i].connect(chain[i + 1]);
    }
  }

  _toggleLFO() {
    if (this.lfoCheckbox.checked) {
      // Reconnect LFO to the live oscillator frequency param
      if (this.osc._oscillator) {
        this.lfo._depthNode.disconnect();
        this.lfo.modulate(this.osc._oscillator.frequency);
      }
      if (this.osc.running) {
        this.lfo.start();
      }
    } else {
      this.lfo.stop();
      this.lfo._depthNode.disconnect();
    }
  }
}

/**
 * Rack wires transport controls and toggle checkboxes to the engine and modules.
 */
export class Rack {
  constructor(engine, modules) {
    this.engine = engine;
    this.osc = modules.oscillator;
    this.noise = modules.noise;
    this.envelope = modules.envelope;
    this.filter = modules.filter;
    this.delay = modules.delay;
    this.lfo = modules.lfo;
    this.output = modules.output;

    this.startBtn = document.getElementById('start-btn');
    this.stopBtn = document.getElementById('stop-btn');
    this.noiseCheckbox = document.getElementById('noise-enabled');
    this.envCheckbox = document.getElementById('env-enabled');
    this.delayCheckbox = document.getElementById('delay-enabled');
    this.lfoCheckbox = document.getElementById('lfo-enabled');

    this._envConnected = false;
    this._delayConnected = false;

    this.startBtn.addEventListener('click', () => this.start());
    this.stopBtn.addEventListener('click', () => this.stop());
    this.noiseCheckbox.addEventListener('change', () => this._toggleNoise());
    this.envCheckbox.addEventListener('change', () => this._toggleEnvelope());
    this.delayCheckbox.addEventListener('change', () => this._toggleDelay());
    this.lfoCheckbox.addEventListener('change', () => this._toggleLFO());
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
    this.startBtn.disabled = true;
    this.stopBtn.disabled = false;
  }

  stop() {
    this.osc.stop();
    this.noise.stop();
    this.lfo.stop();
    if (this.envCheckbox.checked) {
      this.envelope.release();
    }
    this.startBtn.disabled = false;
    this.stopBtn.disabled = true;
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

  _toggleEnvelope() {
    if (this.envCheckbox.checked) {
      // Insert envelope between filter and output
      this.filter.outputNode.disconnect();
      this.filter.connect(this.envelope);
      this.envelope.connect(this._delayConnected ? this.delay : this.output);
      this._envConnected = true;
    } else {
      this.filter.outputNode.disconnect();
      if (this._envConnected) {
        this.envelope.outputNode.disconnect();
      }
      this.filter.connect(this._delayConnected ? this.delay : this.output);
      this._envConnected = false;
    }
  }

  _toggleDelay() {
    if (this.delayCheckbox.checked) {
      // Insert delay before output
      const source = this._envConnected ? this.envelope : this.filter;
      source.outputNode.disconnect();
      source.connect(this.delay);
      this.delay.connect(this.output);
      this._delayConnected = true;
    } else {
      const source = this._envConnected ? this.envelope : this.filter;
      source.outputNode.disconnect();
      this.delay.outputNode.disconnect();
      source.connect(this.output);
      this._delayConnected = false;
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

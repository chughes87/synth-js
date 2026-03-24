/**
 * Rack wires transport controls (Start/Stop) to the AudioEngine and modules.
 */
export class Rack {
  constructor(engine, oscillator) {
    this.engine = engine;
    this.oscillator = oscillator;
    this.startBtn = document.getElementById('start-btn');
    this.stopBtn = document.getElementById('stop-btn');

    this.startBtn.addEventListener('click', () => this.start());
    this.stopBtn.addEventListener('click', () => this.stop());
  }

  async start() {
    await this.engine.start();
    this.oscillator.start();
    this.startBtn.disabled = true;
    this.stopBtn.disabled = false;
  }

  stop() {
    this.oscillator.stop();
    this.startBtn.disabled = false;
    this.stopBtn.disabled = true;
  }
}

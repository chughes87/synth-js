/**
 * VisualizerPanel draws a live waveform from an AnalyserModule onto a <canvas>.
 */
export class VisualizerPanel {
  constructor(analyser) {
    this.analyser = analyser;
    this.canvas = document.getElementById('visualizer-canvas');
    this.ctx = this.canvas.getContext('2d');
    this._animId = null;
    this._running = false;

    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
    this._drawIdle();
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._draw();
  }

  stop() {
    this._running = false;
    if (this._animId !== null) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
    this._drawIdle();
  }

  _resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width - 40; // account for module padding
    this.canvas.height = 150;
    if (!this._running) this._drawIdle();
  }

  _drawIdle() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }

  _draw() {
    if (!this._running) return;
    this._animId = requestAnimationFrame(() => this._draw());

    const { ctx, canvas, analyser } = this;
    const waveform = analyser.getWaveform();
    const bufferLength = waveform.length;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = waveform[i] / 128.0; // normalize 0–255 to 0–2
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
}

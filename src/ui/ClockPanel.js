import { BasePanel } from './BasePanel.js';
import { SUBDIVISION_NAMES } from '../modules/ClockModule.js';

export class ClockPanel extends BasePanel {
  constructor(clockModule, container, instanceId) {
    super(clockModule, container, instanceId);
    this.setTitle('Clock');

    this._buildTransport();
    this.createSlider('BPM', 'bpm', {
      min: 40, max: 300, value: 120, step: 1,
      format: v => `${v} BPM`,
    });
    this.createSelect('Subdivision', 'subdivision',
      SUBDIVISION_NAMES.map(name => ({ value: name, label: name }))
    );
  }

  _buildTransport() {
    const row = document.createElement('div');
    row.className = 'seq-transport';

    const playBtn = document.createElement('button');
    playBtn.textContent = 'Start';
    playBtn.className = 'seq-play-btn';

    const stopBtn = document.createElement('button');
    stopBtn.textContent = 'Stop';
    stopBtn.className = 'seq-stop-btn';
    stopBtn.disabled = true;

    playBtn.addEventListener('click', () => {
      this.module.start();
      playBtn.disabled = true;
      stopBtn.disabled = false;
    });

    stopBtn.addEventListener('click', () => {
      this.module.stop();
      playBtn.disabled = false;
      stopBtn.disabled = true;
    });

    row.appendChild(playBtn);
    row.appendChild(stopBtn);
    this.el.appendChild(row);
  }

  destroy() {
    if (this.module.running) this.module.stop();
    super.destroy();
  }
}

import { BasePanel } from './BasePanel.js';
import { NOTE_NAMES } from '../modules/SequencerModule.js';

/**
 * SequencerPanel — dynamic panel with step grid, BPM, and embedded Play/Stop.
 */
export class SequencerPanel extends BasePanel {
  constructor(sequencerModule, container, instanceId) {
    super(sequencerModule, container, instanceId);
    this.setTitle('Sequencer');
    this.el.classList.add('module-wide');

    this._stepButtons = [];
    this._noteSelects = [];

    this._buildTransport();
    this._buildBpm();
    this._buildGrid();

    this.module.onStepChange = (i) => this._highlightStep(i);
  }

  _buildTransport() {
    const row = document.createElement('div');
    row.className = 'seq-transport';

    const playBtn = document.createElement('button');
    playBtn.textContent = 'Play';
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
      this._clearHighlight();
    });

    this._playBtn = playBtn;
    this._stopBtn = stopBtn;

    row.appendChild(playBtn);
    row.appendChild(stopBtn);
    this.el.appendChild(row);
  }

  _buildBpm() {
    this.createSlider('Tempo', 'bpm', {
      min: 40, max: 300, value: 120, step: 1,
      format: v => `${v} BPM`,
    });
  }

  _buildGrid() {
    const grid = document.createElement('div');
    grid.className = 'sequencer-grid';

    for (let i = 0; i < this.module.numSteps; i++) {
      const col = document.createElement('div');
      col.className = 'seq-step';

      const btn = document.createElement('button');
      btn.className = 'seq-toggle';
      btn.textContent = i + 1;
      if (this.module.steps[i].active) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => this._toggleStep(i, btn));
      this._stepButtons.push(btn);

      const select = document.createElement('select');
      select.className = 'seq-note';
      for (const name of NOTE_NAMES) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (name === this.module.steps[i].note) opt.selected = true;
        select.appendChild(opt);
      }
      select.addEventListener('change', () => {
        this.module.steps[i].note = select.value;
      });
      this._noteSelects.push(select);

      col.appendChild(btn);
      col.appendChild(select);
      grid.appendChild(col);
    }

    this.el.appendChild(grid);
  }

  _toggleStep(i, btn) {
    this.module.steps[i].active = !this.module.steps[i].active;
    btn.classList.toggle('active');
  }

  _highlightStep(i) {
    this._stepButtons.forEach((btn, idx) => {
      btn.classList.toggle('current', idx === i);
    });
  }

  _clearHighlight() {
    this._stepButtons.forEach(btn => btn.classList.remove('current'));
  }

  destroy() {
    if (this.module.running) this.module.stop();
    super.destroy();
  }
}

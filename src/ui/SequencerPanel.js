import { NOTE_NAMES, NOTE_FREQS } from '../modules/SequencerModule.js';

/**
 * SequencerPanel builds a step grid UI and binds it to a SequencerModule.
 */
export class SequencerPanel {
  constructor(sequencerModule) {
    this.module = sequencerModule;
    this.container = document.getElementById('sequencer-grid');
    this.bpmSlider = document.getElementById('seq-bpm');
    this.bpmValue = document.getElementById('seq-bpm-value');
    this._stepButtons = [];
    this._noteSelects = [];

    this._buildGrid();
    this.bpmSlider.addEventListener('input', () => this._onBpm());

    // Highlight current step
    this.module.onStepChange = (i) => this._highlightStep(i);
  }

  _buildGrid() {
    for (let i = 0; i < this.module.numSteps; i++) {
      const col = document.createElement('div');
      col.className = 'seq-step';

      // Toggle button
      const btn = document.createElement('button');
      btn.className = 'seq-toggle';
      btn.textContent = i + 1;
      if (this.module.steps[i].active) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => this._toggleStep(i, btn));
      this._stepButtons.push(btn);

      // Note select
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
      this.container.appendChild(col);
    }
  }

  _toggleStep(i, btn) {
    this.module.steps[i].active = !this.module.steps[i].active;
    btn.classList.toggle('active');
  }

  _onBpm() {
    const val = Number(this.bpmSlider.value);
    this.module.bpm = val;
    this.bpmValue.textContent = `${val} BPM`;
  }

  _highlightStep(i) {
    this._stepButtons.forEach((btn, idx) => {
      btn.classList.toggle('current', idx === i);
    });
  }
}

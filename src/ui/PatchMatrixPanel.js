import { VALID_CONNECTIONS } from '../engine/PatchBay.js';

const ROWS = [
  { id: 'osc', label: 'Osc' },
  { id: 'noise', label: 'Noise' },
  { id: 'filter', label: 'Filter' },
  { id: 'envelope', label: 'Env' },
  { id: 'delay', label: 'Delay' },
  { id: 'lfo', label: 'LFO' },
];

const COLUMNS = [
  { id: 'filter', label: 'Filter' },
  { id: 'envelope', label: 'Env' },
  { id: 'delay', label: 'Delay' },
  { id: 'output', label: 'Out' },
  { id: 'osc.freq', label: 'Osc Hz' },
  { id: 'filter.freq', label: 'Flt Hz' },
  { id: 'filter.q', label: 'Flt Q' },
];

/**
 * PatchMatrixPanel renders a grid table for toggling PatchBay connections.
 */
export class PatchMatrixPanel {
  constructor(patchBay) {
    this.patchBay = patchBay;
    this._cells = new Map();
    this._buildTable();
  }

  _buildTable() {
    const container = document.getElementById('patch-matrix-panel');
    const table = document.createElement('table');
    table.className = 'patch-matrix';

    // Header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); // empty corner
    for (const col of COLUMNS) {
      const th = document.createElement('th');
      th.textContent = col.label;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body rows
    const tbody = document.createElement('tbody');
    for (const row of ROWS) {
      const tr = document.createElement('tr');
      const rowHeader = document.createElement('th');
      rowHeader.textContent = row.label;
      tr.appendChild(rowHeader);

      const allowed = VALID_CONNECTIONS[row.id] ?? [];
      for (const col of COLUMNS) {
        const td = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'patch-cell';

        if (!allowed.includes(col.id)) {
          btn.classList.add('disabled');
          btn.disabled = true;
        } else {
          if (this.patchBay.isConnected(row.id, col.id)) {
            btn.classList.add('active');
          }
          btn.addEventListener('click', () => this._onCellClick(btn, row.id, col.id));
        }

        this._cells.set(`${row.id}->${col.id}`, btn);
        td.appendChild(btn);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    container.appendChild(table);
  }

  _onCellClick(btn, sourceId, targetId) {
    const connected = this.patchBay.toggle(sourceId, targetId);
    btn.classList.toggle('active', connected);
  }

  refresh() {
    for (const [key, btn] of this._cells) {
      if (btn.disabled) continue;
      const [source, target] = key.split('->');
      btn.classList.toggle('active', this.patchBay.isConnected(source, target));
    }
  }
}

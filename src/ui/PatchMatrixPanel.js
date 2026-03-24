import { SIGNAL_CONNECTIONS } from '../engine/SignalPatchBay.js';
import { MOD_CONNECTIONS } from '../engine/ModPatchBay.js';

const SIGNAL_ROWS = [
  { id: 'osc', label: 'Osc' },
  { id: 'noise', label: 'Noise' },
  { id: 'filter', label: 'Filter' },
  { id: 'vca', label: 'VCA' },
  { id: 'delay', label: 'Delay' },
];

const SIGNAL_COLUMNS = [
  { id: 'filter', label: 'Filter' },
  { id: 'vca', label: 'VCA' },
  { id: 'delay', label: 'Delay' },
  { id: 'output', label: 'Out' },
];

const MOD_ROWS = [
  { id: 'lfo', label: 'LFO' },
  { id: 'envelope', label: 'Env' },
];

const MOD_COLUMNS = [
  { id: 'osc.freq', label: 'Osc Hz' },
  { id: 'filter.freq', label: 'Flt Hz' },
  { id: 'filter.q', label: 'Flt Q' },
  { id: 'vca.gain', label: 'VCA Gn' },
];

function buildMatrix(containerId, patchBay, rows, columns, validConnections) {
  const container = document.getElementById(containerId);
  const table = document.createElement('table');
  table.className = 'patch-matrix';
  const cells = new Map();

  // Header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.appendChild(document.createElement('th'));
  for (const col of columns) {
    const th = document.createElement('th');
    th.textContent = col.label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body rows
  const tbody = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    const rowHeader = document.createElement('th');
    rowHeader.textContent = row.label;
    tr.appendChild(rowHeader);

    const allowed = validConnections[row.id] ?? [];
    for (const col of columns) {
      const td = document.createElement('td');
      const btn = document.createElement('button');
      btn.className = 'patch-cell';

      if (!allowed.includes(col.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        if (patchBay.isConnected(row.id, col.id)) {
          btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
          const connected = patchBay.toggle(row.id, col.id);
          btn.classList.toggle('active', connected);
        });
      }

      cells.set(`${row.id}->${col.id}`, btn);
      td.appendChild(btn);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);

  return cells;
}

/**
 * SignalPatchMatrixPanel renders the audio signal routing grid.
 */
export class SignalPatchMatrixPanel {
  constructor(signalPatchBay) {
    this.patchBay = signalPatchBay;
    this._cells = buildMatrix('signal-patch-panel', signalPatchBay, SIGNAL_ROWS, SIGNAL_COLUMNS, SIGNAL_CONNECTIONS);
  }

  refresh() {
    for (const [key, btn] of this._cells) {
      if (btn.disabled) continue;
      const [source, target] = key.split('->');
      btn.classList.toggle('active', this.patchBay.isConnected(source, target));
    }
  }
}

/**
 * ModPatchMatrixPanel renders the modulation routing grid.
 */
export class ModPatchMatrixPanel {
  constructor(modPatchBay) {
    this.patchBay = modPatchBay;
    this._cells = buildMatrix('mod-patch-panel', modPatchBay, MOD_ROWS, MOD_COLUMNS, MOD_CONNECTIONS);
  }

  refresh() {
    for (const [key, btn] of this._cells) {
      if (btn.disabled) continue;
      const [source, target] = key.split('->');
      btn.classList.toggle('active', this.patchBay.isConnected(source, target));
    }
  }
}

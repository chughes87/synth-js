import { SIGNAL_CONNECTIONS } from '../engine/SignalPatchBay.js';
import { MOD_CONNECTIONS } from '../engine/ModPatchBay.js';
import { typeOf } from '../engine/ModuleRegistry.js';

// Module types that can be signal sources (rows)
const SIGNAL_SOURCE_TYPES = new Set(Object.keys(SIGNAL_CONNECTIONS));
// Module types that can be signal targets (columns)
const SIGNAL_TARGET_TYPES = new Set(Object.values(SIGNAL_CONNECTIONS).flat());
// Module types that can be mod sources (rows)
const MOD_SOURCE_TYPES = new Set(Object.keys(MOD_CONNECTIONS));

// CV mod params (continuous modulation targets)
const CV_PARAMS = {
  osc: [{ param: 'freq', label: 'Hz' }],
  filter: [{ param: 'freq', label: 'Hz' }, { param: 'q', label: 'Q' }],
  vca: [{ param: 'gain', label: 'Gn' }],
};

// Trigger params
const TRIG_PARAMS = {
  envelope: [{ param: 'trigger', label: 'Trg' }],
  seq: [{ param: 'start', label: 'Start' }, { param: 'clock', label: 'Clk' }],
};

// Types that can be trigger sources
const TRIG_SOURCE_TYPES = new Set(['seq', 'trigger', 'clock']);

function shortLabel(instanceId) {
  const type = typeOf(instanceId);
  const num = instanceId.slice(type.length + 1);
  const SHORT = { osc: 'Osc', noise: 'Nse', filter: 'Flt', vca: 'VCA', delay: 'Dly', output: 'Out', lfo: 'LFO', envelope: 'Env', seq: 'Seq' };
  return `${SHORT[type] ?? type} ${num}`;
}

function buildMatrix(container, patchBay, rows, columns, validCheck, onChange, onRemove) {
  container.querySelectorAll('table').forEach(t => t.remove());
  if (rows.length === 0 || columns.length === 0) return new Map();

  const table = document.createElement('table');
  table.className = 'patch-matrix';
  const cells = new Map();

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

  const tbody = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    const rowHeader = document.createElement('th');

    if (onRemove) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'module-remove';
      removeBtn.textContent = '\u00d7';
      removeBtn.title = `Remove ${row.label}`;
      removeBtn.addEventListener('click', () => onRemove(row.id));
      rowHeader.appendChild(removeBtn);
    }

    rowHeader.appendChild(document.createTextNode(row.label));
    tr.appendChild(rowHeader);

    for (const col of columns) {
      const td = document.createElement('td');
      const btn = document.createElement('button');
      btn.className = 'patch-cell';

      if (!validCheck(row.id, col.id)) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        if (patchBay.isConnected(row.id, col.id)) {
          btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
          const connected = patchBay.toggle(row.id, col.id);
          btn.classList.toggle('active', connected);
          if (onChange) onChange();
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
 * SignalPatchMatrixPanel — audio signal routing.
 */
export class SignalPatchMatrixPanel {
  constructor(signalPatchBay, activeModules, onChange, onRemove) {
    this.patchBay = signalPatchBay;
    this._activeModules = activeModules;
    this._onChange = onChange;
    this._onRemove = onRemove;
    this._container = document.getElementById('signal-patch-panel');
    this._cells = new Map();
    this.rebuild();
  }

  rebuild() {
    const active = [...this._activeModules];
    const rows = active
      .filter(id => SIGNAL_SOURCE_TYPES.has(typeOf(id)))
      .map(id => ({ id, label: shortLabel(id) }));
    const cols = active
      .filter(id => SIGNAL_TARGET_TYPES.has(typeOf(id)))
      .map(id => ({ id, label: shortLabel(id) }));

    const validCheck = (sourceId, targetId) => {
      const sourceType = typeOf(sourceId);
      const targetType = typeOf(targetId);
      return (SIGNAL_CONNECTIONS[sourceType] ?? []).includes(targetType);
    };

    this._cells = buildMatrix(this._container, this.patchBay, rows, cols, validCheck, this._onChange, this._onRemove);
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
 * ModPatchMatrixPanel — CV modulation routing (LFO, envelope, seq → freq/q/gain).
 */
export class ModPatchMatrixPanel {
  constructor(modPatchBay, activeModules, onChange, onRemove) {
    this.patchBay = modPatchBay;
    this._activeModules = activeModules;
    this._onChange = onChange;
    this._onRemove = onRemove;
    this._container = document.getElementById('mod-patch-panel');
    this._cells = new Map();
    this.rebuild();
  }

  rebuild() {
    const active = [...this._activeModules];
    const rows = active
      .filter(id => MOD_SOURCE_TYPES.has(typeOf(id)))
      .map(id => ({ id, label: shortLabel(id) }));

    const cols = [];
    for (const id of active) {
      const type = typeOf(id);
      const params = CV_PARAMS[type];
      if (!params) continue;
      for (const p of params) {
        cols.push({ id: `${id}.${p.param}`, label: `${shortLabel(id)} ${p.label}` });
      }
    }

    const validCheck = (sourceId, targetId) => {
      const sourceType = typeOf(sourceId);
      const dotIdx = targetId.lastIndexOf('.');
      const targetInstanceId = targetId.slice(0, dotIdx);
      const param = targetId.slice(dotIdx + 1);
      const targetType = typeOf(targetInstanceId);
      const typeTarget = `${targetType}.${param}`;
      return (MOD_CONNECTIONS[sourceType] ?? []).includes(typeTarget);
    };

    this._cells = buildMatrix(this._container, this.patchBay, rows, cols, validCheck, this._onChange, this._onRemove);
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
 * TrigPatchMatrixPanel — trigger routing (seq → envelope trigger).
 */
export class TrigPatchMatrixPanel {
  constructor(modPatchBay, activeModules, onChange, onRemove) {
    this.patchBay = modPatchBay;
    this._activeModules = activeModules;
    this._onChange = onChange;
    this._onRemove = onRemove;
    this._container = document.getElementById('trig-patch-panel');
    this._cells = new Map();
    this.rebuild();
  }

  rebuild() {
    const active = [...this._activeModules];
    const rows = active
      .filter(id => TRIG_SOURCE_TYPES.has(typeOf(id)))
      .map(id => ({ id, label: shortLabel(id) }));

    const cols = [];
    for (const id of active) {
      const type = typeOf(id);
      const params = TRIG_PARAMS[type];
      if (!params) continue;
      for (const p of params) {
        cols.push({ id: `${id}.${p.param}`, label: `${shortLabel(id)} ${p.label}` });
      }
    }

    const validCheck = (sourceId, targetId) => {
      const sourceType = typeOf(sourceId);
      const dotIdx = targetId.lastIndexOf('.');
      const targetInstanceId = targetId.slice(0, dotIdx);
      const param = targetId.slice(dotIdx + 1);
      const targetType = typeOf(targetInstanceId);
      const typeTarget = `${targetType}.${param}`;
      return (MOD_CONNECTIONS[sourceType] ?? []).includes(typeTarget);
    };

    this._cells = buildMatrix(this._container, this.patchBay, rows, cols, validCheck, this._onChange, this._onRemove);
  }

  refresh() {
    for (const [key, btn] of this._cells) {
      if (btn.disabled) continue;
      const [source, target] = key.split('->');
      btn.classList.toggle('active', this.patchBay.isConnected(source, target));
    }
  }
}

/**
 * PatchVisualizerPanel draws a node graph of active module instances.
 * Signal connections are solid lines, modulation connections are dashed.
 * Positions are computed dynamically based on active instances.
 */

import { typeOf, splitModTarget } from '../engine/ModuleRegistry.js';

const NODE_W = 64;
const NODE_H = 32;
const PADDING = 20;

// Column positions by role (fractional x)
const COLUMN_X = {
  source: 0.08,    // osc, noise
  process: 0.30,   // filter
  amp: 0.52,       // vca, delay
  output: 0.74,    // output
  mod: 0.08,       // lfo, envelope (bottom row)
};

const TYPE_COLUMN = {
  osc: 'source', noise: 'source',
  filter: 'process',
  vca: 'amp', delay: 'amp',
  output: 'output',
  lfo: 'mod', envelope: 'mod', seq: 'mod', trigger: 'mod', clock: 'mod',
};

const SIGNAL_COLOR = '#e94560';
const MOD_COLOR = '#53d8fb';
const NODE_BG = '#0f3460';
const NODE_BORDER = '#1a1a4e';
const NODE_TEXT = '#e0e0e0';
const BG_COLOR = '#0a0a1a';

function shortLabel(instanceId) {
  const type = typeOf(instanceId);
  const num = instanceId.slice(type.length + 1);
  const SHORT = { osc: 'OSC', noise: 'NSE', filter: 'FLT', vca: 'VCA', delay: 'DLY', output: 'OUT', lfo: 'LFO', envelope: 'ENV', seq: 'SEQ', trigger: 'TRG', clock: 'CLK' };
  return `${SHORT[type] ?? type} ${num}`;
}

export class PatchVisualizerPanel {
  constructor(signalPatchBay, modPatchBay, activeModules) {
    this.signalPatchBay = signalPatchBay;
    this.modPatchBay = modPatchBay;
    this._activeModules = activeModules;
    this.canvas = document.getElementById('patch-viz-canvas');
    this.ctx = this.canvas.getContext('2d');

    this._resizeCanvas();
    window.addEventListener('resize', () => {
      this._resizeCanvas();
      this.refresh();
    });
    this.refresh();
  }

  _resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width - 40;
    // Height is computed dynamically in refresh() based on module count
  }

  _computeLayout() {
    const active = [...this._activeModules];
    const MOD_TYPES = new Set(['lfo', 'envelope', 'seq', 'trigger', 'clock']);
    const MIN_NODE_SPACING = NODE_H + 8;

    // Group into signal row and mod row columns
    const signalCols = {};
    const modCols = {};
    for (const id of active) {
      const type = typeOf(id);
      const col = TYPE_COLUMN[type] ?? 'source';
      if (MOD_TYPES.has(type)) {
        if (!modCols[col]) modCols[col] = [];
        modCols[col].push(id);
      } else {
        if (!signalCols[col]) signalCols[col] = [];
        signalCols[col].push(id);
      }
    }

    // Find tallest column in each row
    const maxSignal = Math.max(0, ...Object.values(signalCols).map(ids => ids.length));
    const maxMod = Math.max(0, ...Object.values(modCols).map(ids => ids.length));

    // Compute required height
    const signalHeight = Math.max(0, maxSignal * MIN_NODE_SPACING);
    const modHeight = Math.max(0, maxMod * MIN_NODE_SPACING);
    const gap = (maxSignal > 0 && maxMod > 0) ? 20 : 0;
    const totalHeight = PADDING * 2 + signalHeight + gap + modHeight + 20; // 20 for legend
    const h = Math.max(100, totalHeight);

    const w = this.canvas.width;
    this.canvas.height = h;

    const colXMap = { source: 0.08, process: 0.30, amp: 0.52, output: 0.74 };

    const nodes = {};

    // Place signal nodes
    const signalTop = PADDING;
    for (const [col, ids] of Object.entries(signalCols)) {
      const fx = colXMap[col] ?? 0.5;
      const x = PADDING + fx * (w - 2 * PADDING - NODE_W);
      for (let i = 0; i < ids.length; i++) {
        nodes[ids[i]] = { x, y: signalTop + i * MIN_NODE_SPACING };
      }
    }

    // Place mod nodes below signal section
    const modTop = signalTop + signalHeight + gap;
    for (const [col, ids] of Object.entries(modCols)) {
      const fx = colXMap[col] ?? 0.08;
      const x = PADDING + fx * (w - 2 * PADDING - NODE_W);
      for (let i = 0; i < ids.length; i++) {
        nodes[ids[i]] = { x, y: modTop + i * MIN_NODE_SPACING };
      }
    }

    return { nodes, w, h };
  }

  refresh() {
    const { ctx } = this;
    const { nodes, w, h } = this._computeLayout();

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Draw signal connections
    for (const { source, target } of this.signalPatchBay.getConnections()) {
      if (nodes[source] && nodes[target]) {
        this._drawConnection(ctx, nodes[source], nodes[target], SIGNAL_COLOR, false);
      }
    }

    // Draw mod connections
    for (const { source, target } of this.modPatchBay.getConnections()) {
      const [targetInstanceId] = splitModTarget(target);
      if (nodes[source] && nodes[targetInstanceId]) {
        this._drawConnection(ctx, nodes[source], nodes[targetInstanceId], MOD_COLOR, true);
      }
    }

    // Draw nodes
    for (const [id, pos] of Object.entries(nodes)) {
      const isMod = new Set(['lfo', 'envelope']).has(typeOf(id));
      this._drawNode(ctx, pos, shortLabel(id), isMod);
    }

    this._drawLegend(ctx, w, h);
  }

  _drawConnection(ctx, from, to, color, dashed) {
    const startX = from.x + NODE_W;
    const startY = from.y + NODE_H / 2;
    const endX = to.x;
    const endY = to.y + NODE_H / 2;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    if (dashed) ctx.setLineDash([6, 4]);

    const cpOffset = Math.abs(endX - startX) * 0.4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(startX + cpOffset, startY, endX - cpOffset, endY, endX, endY);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(endY - (endY - (endY - startY) * 0.1), endX - (endX - cpOffset));
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - 8 * Math.cos(angle - 0.4), endY - 8 * Math.sin(angle - 0.4));
    ctx.lineTo(endX - 8 * Math.cos(angle + 0.4), endY - 8 * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawNode(ctx, pos, label, isMod) {
    const { x, y } = pos;
    ctx.fillStyle = NODE_BG;
    ctx.strokeStyle = isMod ? MOD_COLOR : NODE_BORDER;
    ctx.lineWidth = isMod ? 1.5 : 1;
    ctx.beginPath();
    ctx.roundRect(x, y, NODE_W, NODE_H, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = NODE_TEXT;
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + NODE_W / 2, y + NODE_H / 2);
  }

  _drawLegend(ctx, w, h) {
    const y = h - 12;
    const startX = w - 200;
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = SIGNAL_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + 20, y);
    ctx.stroke();
    ctx.fillStyle = '#a0a0b0';
    ctx.fillText('signal', startX + 26, y);

    ctx.strokeStyle = MOD_COLOR;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(startX + 80, y);
    ctx.lineTo(startX + 100, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('mod', startX + 106, y);
  }
}

/**
 * PatchVisualizerPanel draws a node graph of the current patch configuration.
 * Signal connections are solid lines, modulation connections are dashed.
 */

const NODE_W = 64;
const NODE_H = 32;
const PADDING = 20;

// Node positions as fractions of canvas [x, y] — laid out left-to-right signal flow
const NODE_POSITIONS = {
  osc:      [0.08, 0.22],
  noise:    [0.08, 0.50],
  filter:   [0.30, 0.22],
  vca:      [0.52, 0.22],
  delay:    [0.52, 0.50],
  output:   [0.74, 0.36],
  lfo:      [0.08, 0.78],
  envelope: [0.30, 0.78],
};

// Mod target positions — where the arrow lands on the target module
const MOD_TARGET_NODES = {
  'osc.freq':    'osc',
  'filter.freq': 'filter',
  'filter.q':    'filter',
  'vca.gain':    'vca',
};

const NODE_LABELS = {
  osc: 'OSC',
  noise: 'NOISE',
  filter: 'FLT',
  vca: 'VCA',
  delay: 'DLY',
  output: 'OUT',
  lfo: 'LFO',
  envelope: 'ENV',
};

const SIGNAL_COLOR = '#e94560';
const MOD_COLOR = '#53d8fb';
const NODE_BG = '#0f3460';
const NODE_BORDER = '#1a1a4e';
const NODE_TEXT = '#e0e0e0';
const BG_COLOR = '#0a0a1a';

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
    this.canvas.height = 200;
  }

  refresh() {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Compute pixel positions for active modules only
    const nodes = {};
    for (const [id, [fx, fy]] of Object.entries(NODE_POSITIONS)) {
      if (!this._activeModules.has(id)) continue;
      nodes[id] = {
        x: PADDING + fx * (w - 2 * PADDING - NODE_W),
        y: PADDING + fy * (h - 2 * PADDING - NODE_H),
      };
    }

    // Draw signal connections
    const signalConns = this.signalPatchBay.getConnections();
    for (const { source, target } of signalConns) {
      this._drawConnection(ctx, nodes[source], nodes[target], SIGNAL_COLOR, false);
    }

    // Draw mod connections
    const modConns = this.modPatchBay.getConnections();
    for (const { source, target } of modConns) {
      const targetNode = MOD_TARGET_NODES[target];
      if (targetNode && nodes[targetNode]) {
        this._drawConnection(ctx, nodes[source], nodes[targetNode], MOD_COLOR, true);
      }
    }

    // Draw nodes on top
    for (const [id, pos] of Object.entries(nodes)) {
      this._drawNode(ctx, pos, NODE_LABELS[id], id);
    }

    // Legend
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

    ctx.beginPath();
    // Bezier curve for smooth routing
    const cpOffset = Math.abs(endX - startX) * 0.4;
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

  _drawNode(ctx, pos, label, id) {
    const { x, y } = pos;
    const isModSource = id === 'lfo' || id === 'envelope';

    ctx.fillStyle = NODE_BG;
    ctx.strokeStyle = isModSource ? MOD_COLOR : NODE_BORDER;
    ctx.lineWidth = isModSource ? 1.5 : 1;
    ctx.beginPath();
    ctx.roundRect(x, y, NODE_W, NODE_H, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = NODE_TEXT;
    ctx.font = '11px "Courier New", monospace';
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

    // Signal
    ctx.strokeStyle = SIGNAL_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + 20, y);
    ctx.stroke();
    ctx.fillStyle = '#a0a0b0';
    ctx.fillText('signal', startX + 26, y);

    // Mod
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

import { AudioEngine } from './engine/AudioEngine.js';
import { ModuleRegistry, MODULE_TYPES, typeOf } from './engine/ModuleRegistry.js';
import { SignalPatchBay } from './engine/SignalPatchBay.js';
import { ModPatchBay } from './engine/ModPatchBay.js';
import { OscillatorPanel } from './ui/OscillatorPanel.js';
import { OutputPanel } from './ui/OutputPanel.js';
import { FilterPanel } from './ui/FilterPanel.js';
import { DelayPanel } from './ui/DelayPanel.js';
import { LFOPanel } from './ui/LFOPanel.js';
import { EnvelopePanel } from './ui/EnvelopePanel.js';
import { VCAPanel } from './ui/VCAPanel.js';
import { NoisePanel } from './ui/NoisePanel.js';
import { SequencerPanel } from './ui/SequencerPanel.js';
import { TriggerPanel } from './ui/TriggerPanel.js';
import { AnalyserModule } from './modules/AnalyserModule.js';
import { OutputModule } from './modules/OutputModule.js';
import { VisualizerPanel } from './ui/VisualizerPanel.js';
import { SignalPatchMatrixPanel, ModPatchMatrixPanel, TrigPatchMatrixPanel } from './ui/PatchMatrixPanel.js';
import { PatchVisualizerPanel } from './ui/PatchVisualizerPanel.js';
import { Rack } from './ui/Rack.js';

const engine = new AudioEngine();
const ctx = engine.context;

// Module registry — creates instances on demand
const registry = new ModuleRegistry(ctx);

// Non-routable modules (always present)
const analyser = new AnalyserModule(ctx);

// Permanent output wiring: output → analyser → destination
const permanentOutput = new OutputModule(ctx);
permanentOutput.inputNode.disconnect();
permanentOutput.inputNode.connect(analyser.inputNode);
analyser.connect({ inputNode: ctx.destination });

// Patch bays use registry for dynamic lookups
const signalPatchBay = new SignalPatchBay(registry);
const modPatchBay = new ModPatchBay(registry);

// --- Active module tracking ---
const activeModules = new Set();
const panels = new Map(); // instanceId → panel

const PANEL_CLASSES = {
  osc: OscillatorPanel,
  noise: NoisePanel,
  filter: FilterPanel,
  vca: VCAPanel,
  delay: DelayPanel,
  output: OutputPanel,
  lfo: LFOPanel,
  envelope: EnvelopePanel,
  seq: SequencerPanel,
  trigger: TriggerPanel,
};

const modulePanels = document.getElementById('module-panels');

function onPatchChange() {
  patchViz.refresh();
  if (rack) rack.onPatchChange();
}

function onModulesChange() {
  signalMatrix.rebuild();
  modMatrix.rebuild();
  trigMatrix.rebuild();
  patchViz.refresh();
}

function addModule(type) {
  const { id, module } = registry.create(type);
  activeModules.add(id);

  // If it's an output module, wire it to the permanent analyser chain
  if (type === 'output') {
    module.inputNode.disconnect();
    module.inputNode.connect(permanentOutput.inputNode);
  }

  const PanelClass = PANEL_CLASSES[type];
  if (PanelClass) {
    const panel = new PanelClass(module, modulePanels, id);
    panels.set(id, panel);
  }

  // Wire control modules
  if (type === 'seq' && rack) {
    rack.wireSequencer(id);
  } else if (type === 'trigger' && rack) {
    rack.wireTrigger(id);
  }

  onModulesChange();
  if (rack) rack.startModule(id);
  return id;
}

function removeModule(instanceId) {
  signalPatchBay.disconnectAll(instanceId);
  modPatchBay.disconnectAll(instanceId);
  panels.get(instanceId)?.destroy();
  panels.delete(instanceId);
  registry.remove(instanceId);
  activeModules.delete(instanceId);
  onModulesChange();
}

// --- Presets ---
const PRESETS = {
  subtractive: {
    modules: ['osc', 'filter', 'vca', 'output', 'envelope'],
    signal: [[0, 1], [1, 2], [2, 3]],
    mod: [[4, '2.gain']],
  },
  sequenced: {
    modules: ['seq', 'osc', 'filter', 'vca', 'output', 'envelope'],
    signal: [[1, 2], [2, 3], [3, 4]],
    mod: [[0, '1.freq'], [0, '5.trigger'], [5, '3.gain']],
  },
  // Two oscillators slightly detuned into same filter — thick unison
  'dual-detune': {
    modules: ['osc', 'osc', 'filter', 'vca', 'output', 'envelope'],
    signal: [[0, 2], [1, 2], [2, 3], [3, 4]],
    mod: [[5, '3.gain']],
  },
  // Two LFOs modulating different params at different rates
  'cross-mod': {
    modules: ['osc', 'filter', 'vca', 'output', 'lfo', 'lfo', 'envelope'],
    signal: [[0, 1], [1, 2], [2, 3]],
    mod: [[4, '0.freq'], [5, '1.freq'], [6, '2.gain']],
  },
  // Sequencer triggering envelope on noise→filter for percussive hits
  'noise-perc': {
    modules: ['seq', 'noise', 'filter', 'vca', 'output', 'envelope'],
    signal: [[1, 2], [2, 3], [3, 4]],
    mod: [[0, '5.trigger'], [5, '3.gain'], [5, '2.freq']],
  },
  // Two sequencers at different tempos hitting different oscillators
  polyrhythm: {
    modules: ['seq', 'seq', 'osc', 'osc', 'filter', 'vca', 'output', 'envelope', 'envelope'],
    signal: [[2, 4], [3, 4], [4, 5], [5, 6]],
    mod: [[0, '2.freq'], [1, '3.freq'], [0, '7.trigger'], [1, '8.trigger'], [7, '5.gain'], [8, '5.gain']],
  },
  // Osc + noise through filter with slow LFO sweep + delay feedback
  'drone-wash': {
    modules: ['osc', 'noise', 'filter', 'vca', 'delay', 'output', 'lfo'],
    signal: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5]],
    mod: [[6, '2.freq']],
  },
  // FM-ish — LFO at audio-ish rate into osc frequency for metallic tones
  'fm-bell': {
    modules: ['osc', 'vca', 'output', 'lfo', 'envelope'],
    signal: [[0, 1], [1, 2]],
    mod: [[3, '0.freq'], [4, '1.gain']],
  },
  // Noise through two parallel filters into delay — textural chaos
  'filter-duo': {
    modules: ['noise', 'filter', 'filter', 'vca', 'delay', 'output', 'lfo', 'lfo'],
    signal: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]],
    mod: [[6, '1.freq'], [7, '2.freq']],
  },
  // Sequenced noise bursts with LFO on filter — glitchy industrial
  'glitch-seq': {
    modules: ['seq', 'noise', 'filter', 'vca', 'delay', 'output', 'envelope', 'lfo'],
    signal: [[1, 2], [2, 3], [3, 4], [4, 5]],
    mod: [[0, '6.trigger'], [6, '3.gain'], [7, '2.freq'], [7, '2.q']],
  },
  // Three oscillators into filter — massive chord drone
  'triad-drone': {
    modules: ['osc', 'osc', 'osc', 'filter', 'vca', 'delay', 'output', 'lfo'],
    signal: [[0, 3], [1, 3], [2, 3], [3, 4], [4, 5], [5, 6]],
    mod: [[7, '3.freq']],
  },
  // Sequencer driving osc + envelope on filter freq for acid bass
  'acid-bass': {
    modules: ['seq', 'osc', 'filter', 'vca', 'output', 'envelope', 'envelope'],
    signal: [[1, 2], [2, 3], [3, 4]],
    mod: [[0, '1.freq'], [0, '5.trigger'], [0, '6.trigger'], [5, '3.gain'], [6, '2.freq']],
  },
  // Two sequencers → two oscs → two filters → delay → out — stereo-ish madness
  'dual-seq': {
    modules: ['seq', 'seq', 'osc', 'osc', 'filter', 'filter', 'vca', 'delay', 'output', 'envelope', 'envelope'],
    signal: [[2, 4], [3, 5], [4, 6], [5, 6], [6, 7], [7, 8]],
    mod: [[0, '2.freq'], [1, '3.freq'], [0, '9.trigger'], [1, '10.trigger'], [9, '6.gain'], [10, '6.gain']],
  },
  // Everything modulating everything — pure chaos
  'chaos': {
    modules: ['osc', 'osc', 'noise', 'filter', 'filter', 'vca', 'delay', 'output', 'lfo', 'lfo', 'envelope'],
    signal: [[0, 3], [1, 4], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6], [6, 7]],
    mod: [[8, '0.freq'], [9, '1.freq'], [8, '3.freq'], [9, '4.freq'], [8, '3.q'], [9, '4.q'], [10, '5.gain']],
  },
};

// --- Module picker UI ---
const moduleSelect = document.getElementById('module-select');
const moduleAddBtn = document.getElementById('module-add-btn');
const presetSelect = document.getElementById('preset-select');

function populateModuleSelect() {
  moduleSelect.innerHTML = '';
  for (const [type, config] of Object.entries(MODULE_TYPES)) {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = config.label;
    moduleSelect.appendChild(opt);
  }
}

function loadPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;

  for (const id of [...activeModules]) {
    removeModule(id);
  }

  const ids = preset.modules.map(type => addModule(type));

  for (const [srcIdx, tgtIdx] of preset.signal) {
    signalPatchBay.connect(ids[srcIdx], ids[tgtIdx]);
  }

  for (const [srcIdx, targetRef] of preset.mod) {
    const dotIdx = targetRef.indexOf('.');
    const tgtIdx = Number(targetRef.slice(0, dotIdx));
    const param = targetRef.slice(dotIdx + 1);
    modPatchBay.connect(ids[srcIdx], `${ids[tgtIdx]}.${param}`);
  }

  onModulesChange();
}

moduleAddBtn.addEventListener('click', () => {
  const type = moduleSelect.value;
  if (type) addModule(type);
});

presetSelect.addEventListener('change', () => {
  const name = presetSelect.value;
  if (name) {
    loadPreset(name);
    presetSelect.value = '';
  }
});

// --- UI panels (non-routable) ---
const vizPanel = new VisualizerPanel(analyser);
const patchViz = new PatchVisualizerPanel(signalPatchBay, modPatchBay, activeModules);
const signalMatrix = new SignalPatchMatrixPanel(signalPatchBay, activeModules, onPatchChange, removeModule);
const modMatrix = new ModPatchMatrixPanel(modPatchBay, activeModules, onPatchChange, removeModule);
const trigMatrix = new TrigPatchMatrixPanel(modPatchBay, activeModules, onPatchChange, removeModule);
const rack = new Rack(engine, registry, activeModules, signalPatchBay, modPatchBay, vizPanel);

populateModuleSelect();

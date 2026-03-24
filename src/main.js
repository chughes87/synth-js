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
import { SequencerModule } from './modules/SequencerModule.js';
import { SequencerPanel } from './ui/SequencerPanel.js';
import { AnalyserModule } from './modules/AnalyserModule.js';
import { OutputModule } from './modules/OutputModule.js';
import { VisualizerPanel } from './ui/VisualizerPanel.js';
import { SignalPatchMatrixPanel, ModPatchMatrixPanel } from './ui/PatchMatrixPanel.js';
import { PatchVisualizerPanel } from './ui/PatchVisualizerPanel.js';
import { Rack } from './ui/Rack.js';

const engine = new AudioEngine();
const ctx = engine.context;

// Module registry — creates instances on demand
const registry = new ModuleRegistry(ctx);

// Non-routable modules (always present)
const analyser = new AnalyserModule(ctx);
const sequencer = new SequencerModule(ctx);

// Permanent output wiring: output → analyser → destination
// (Output modules are user-routable; analyser is not)
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
};

const modulePanels = document.getElementById('module-panels');

function onPatchChange() {
  patchViz.refresh();
}

function onModulesChange() {
  signalMatrix.rebuild();
  modMatrix.rebuild();
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

  onModulesChange();
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
    signal: [[0, 1], [1, 2], [2, 3]],  // indices into modules array
    mod: [[4, '3.gain']],  // [source idx, 'target_idx.param']
  },
  fm: {
    modules: ['osc', 'output', 'lfo'],
    signal: [[0, 1]],
    mod: [[2, '0.freq']],
  },
  noisepad: {
    modules: ['noise', 'filter', 'vca', 'output', 'envelope', 'lfo'],
    signal: [[0, 1], [1, 2], [2, 3]],
    mod: [[4, '2.gain'], [5, '1.freq']],
  },
};

function loadPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;

  // Clear everything
  for (const id of [...activeModules]) {
    removeModule(id);
  }

  // Create modules, track instance IDs by index
  const ids = preset.modules.map(type => addModule(type));

  // Signal connections by index
  for (const [srcIdx, tgtIdx] of preset.signal) {
    signalPatchBay.connect(ids[srcIdx], ids[tgtIdx]);
  }

  // Mod connections: target is 'targetIdx.param'
  for (const [srcIdx, targetRef] of preset.mod) {
    const dotIdx = targetRef.indexOf('.');
    const tgtIdx = Number(targetRef.slice(0, dotIdx));
    const param = targetRef.slice(dotIdx + 1);
    modPatchBay.connect(ids[srcIdx], `${ids[tgtIdx]}.${param}`);
  }

  onModulesChange();
}

// --- Module picker UI ---
const moduleSelect = document.getElementById('module-select');
const moduleAddBtn = document.getElementById('module-add-btn');
const presetSelect = document.getElementById('preset-select');

// Always show all types (duplicates allowed)
function populateModuleSelect() {
  moduleSelect.innerHTML = '';
  for (const [type, config] of Object.entries(MODULE_TYPES)) {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = config.label;
    moduleSelect.appendChild(opt);
  }
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
new SequencerPanel(sequencer);
const vizPanel = new VisualizerPanel(analyser);
const patchViz = new PatchVisualizerPanel(signalPatchBay, modPatchBay, activeModules);
const signalMatrix = new SignalPatchMatrixPanel(signalPatchBay, activeModules, onPatchChange, removeModule);
const modMatrix = new ModPatchMatrixPanel(modPatchBay, activeModules, onPatchChange, removeModule);
new Rack(engine, registry, activeModules, signalPatchBay, modPatchBay, sequencer, vizPanel);

// Start with empty patch
populateModuleSelect();

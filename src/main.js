import { AudioEngine } from './engine/AudioEngine.js';
import { SignalPatchBay } from './engine/SignalPatchBay.js';
import { ModPatchBay } from './engine/ModPatchBay.js';
import { OscillatorModule } from './modules/OscillatorModule.js';
import { NoiseModule } from './modules/NoiseModule.js';
import { EnvelopeModule } from './modules/EnvelopeModule.js';
import { FilterModule } from './modules/FilterModule.js';
import { LFOModule } from './modules/LFOModule.js';
import { DelayModule } from './modules/DelayModule.js';
import { VCAModule } from './modules/VCAModule.js';
import { OutputModule } from './modules/OutputModule.js';
import { AnalyserModule } from './modules/AnalyserModule.js';
import { OscillatorPanel } from './ui/OscillatorPanel.js';
import { OutputPanel } from './ui/OutputPanel.js';
import { FilterPanel } from './ui/FilterPanel.js';
import { DelayPanel } from './ui/DelayPanel.js';
import { LFOPanel } from './ui/LFOPanel.js';
import { EnvelopePanel } from './ui/EnvelopePanel.js';
import { VCAPanel } from './ui/VCAPanel.js';
import { SequencerModule } from './modules/SequencerModule.js';
import { SequencerPanel } from './ui/SequencerPanel.js';
import { VisualizerPanel } from './ui/VisualizerPanel.js';
import { SignalPatchMatrixPanel, ModPatchMatrixPanel } from './ui/PatchMatrixPanel.js';
import { PatchVisualizerPanel } from './ui/PatchVisualizerPanel.js';
import { Rack } from './ui/Rack.js';

const engine = new AudioEngine();
const ctx = engine.context;

// All modules are instantiated upfront (cheap Web Audio nodes)
const oscillator = new OscillatorModule(ctx);
const noise = new NoiseModule(ctx);
const envelope = new EnvelopeModule(ctx);
const filter = new FilterModule(ctx);
const lfo = new LFOModule(ctx);
const delay = new DelayModule(ctx);
const vca = new VCAModule(ctx);
const output = new OutputModule(ctx);
const analyser = new AnalyserModule(ctx);
const sequencer = new SequencerModule(ctx);

// Analyser is permanently wired after output (not user-routable)
output.inputNode.disconnect();
output.inputNode.connect(analyser.inputNode);
analyser.connect({ inputNode: ctx.destination });

const modules = { osc: oscillator, noise, filter, vca, envelope, delay, lfo, output };

// Patch bays
const signalPatchBay = new SignalPatchBay(modules);
const modPatchBay = new ModPatchBay(modules);

// --- Active module tracking ---
const ALL_MODULES = [
  { id: 'osc', label: 'Oscillator' },
  { id: 'noise', label: 'Noise' },
  { id: 'filter', label: 'Filter' },
  { id: 'vca', label: 'VCA' },
  { id: 'delay', label: 'Delay' },
  { id: 'output', label: 'Output' },
  { id: 'lfo', label: 'LFO' },
  { id: 'envelope', label: 'Envelope' },
];

const activeModules = new Set();

function onPatchChange() {
  patchViz.refresh();
}

function onModulesChange() {
  signalMatrix.rebuild();
  modMatrix.rebuild();
  patchViz.refresh();
  populateModuleSelect();
}

function addModule(id) {
  if (activeModules.has(id)) return;
  activeModules.add(id);
  onModulesChange();
}

function removeModule(id) {
  if (!activeModules.has(id)) return;
  signalPatchBay.disconnectAll(id);
  modPatchBay.disconnectAll(id);
  activeModules.delete(id);
  onModulesChange();
}

// --- Presets ---
const PRESETS = {
  subtractive: {
    modules: ['osc', 'filter', 'vca', 'output', 'envelope'],
    signal: [['osc', 'filter'], ['filter', 'vca'], ['vca', 'output']],
    mod: [['envelope', 'vca.gain']],
  },
  fm: {
    modules: ['osc', 'output', 'lfo'],
    signal: [['osc', 'output']],
    mod: [['lfo', 'osc.freq']],
  },
  noisepad: {
    modules: ['noise', 'filter', 'vca', 'output', 'envelope', 'lfo'],
    signal: [['noise', 'filter'], ['filter', 'vca'], ['vca', 'output']],
    mod: [['envelope', 'vca.gain'], ['lfo', 'filter.freq']],
  },
};

function loadPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;

  // Clear everything
  for (const id of [...activeModules]) {
    signalPatchBay.disconnectAll(id);
    modPatchBay.disconnectAll(id);
  }
  activeModules.clear();

  // Add modules
  for (const id of preset.modules) {
    activeModules.add(id);
  }

  // Make connections
  for (const [src, tgt] of preset.signal) {
    signalPatchBay.connect(src, tgt);
  }
  for (const [src, tgt] of preset.mod) {
    modPatchBay.connect(src, tgt);
  }

  onModulesChange();
}

// --- Module picker UI ---
const moduleSelect = document.getElementById('module-select');
const moduleAddBtn = document.getElementById('module-add-btn');
const presetSelect = document.getElementById('preset-select');

function populateModuleSelect() {
  moduleSelect.innerHTML = '';
  const available = ALL_MODULES.filter(m => !activeModules.has(m.id));
  if (available.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = 'All modules added';
    opt.disabled = true;
    moduleSelect.appendChild(opt);
    moduleAddBtn.disabled = true;
  } else {
    moduleAddBtn.disabled = false;
    for (const m of available) {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.label;
      moduleSelect.appendChild(opt);
    }
  }
}

moduleAddBtn.addEventListener('click', () => {
  const id = moduleSelect.value;
  if (id) addModule(id);
});

presetSelect.addEventListener('change', () => {
  const name = presetSelect.value;
  if (name) {
    loadPreset(name);
    presetSelect.value = '';
  }
});

// --- UI panels ---
const modulePanels = document.getElementById('module-panels');
new OscillatorPanel(oscillator, modulePanels);
new OutputPanel(output, modulePanels);
new FilterPanel(filter, modulePanels);
new DelayPanel(delay, modulePanels);
new LFOPanel(lfo, modulePanels);
new EnvelopePanel(envelope, modulePanels);
new VCAPanel(vca, modulePanels);
new SequencerPanel(sequencer);
const vizPanel = new VisualizerPanel(analyser);
const patchViz = new PatchVisualizerPanel(signalPatchBay, modPatchBay, activeModules);
const signalMatrix = new SignalPatchMatrixPanel(signalPatchBay, activeModules, onPatchChange, removeModule);
const modMatrix = new ModPatchMatrixPanel(modPatchBay, activeModules, onPatchChange, removeModule);
new Rack(engine, { oscillator, noise, envelope, filter, vca, delay, lfo, output, sequencer }, signalPatchBay, modPatchBay, vizPanel);

// Start with empty patch — populate the dropdown
populateModuleSelect();

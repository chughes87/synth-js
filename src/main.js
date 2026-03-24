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

// Separate patch bays for audio and modulation routing
const signalPatchBay = new SignalPatchBay(modules);
const modPatchBay = new ModPatchBay(modules);

// No default connections — user patches everything via the matrix grids

// UI panels
new OscillatorPanel(oscillator);
new OutputPanel(output);
new FilterPanel(filter);
new DelayPanel(delay);
new LFOPanel(lfo);
new EnvelopePanel(envelope);
new VCAPanel(vca);
new SequencerPanel(sequencer);
const vizPanel = new VisualizerPanel(analyser);
const patchViz = new PatchVisualizerPanel(signalPatchBay, modPatchBay);
const onPatchChange = () => patchViz.refresh();
new SignalPatchMatrixPanel(signalPatchBay, onPatchChange);
new ModPatchMatrixPanel(modPatchBay, onPatchChange);
new Rack(engine, { oscillator, noise, envelope, filter, vca, delay, lfo, output, sequencer }, signalPatchBay, modPatchBay, vizPanel);

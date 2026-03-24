import { AudioEngine } from './engine/AudioEngine.js';
import { PatchBay } from './engine/PatchBay.js';
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
import { PatchMatrixPanel } from './ui/PatchMatrixPanel.js';
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

// PatchBay manages all user-routable connections
const patchBay = new PatchBay({ osc: oscillator, noise, filter, vca, envelope, delay, lfo, output });

// Default signal chain: osc → filter → vca → output, envelope → vca.gain
patchBay.connect('osc', 'filter');
patchBay.connect('filter', 'vca');
patchBay.connect('vca', 'output');
patchBay.connect('envelope', 'vca.gain');

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
new PatchMatrixPanel(patchBay);
new Rack(engine, { oscillator, noise, envelope, filter, vca, delay, lfo, output, sequencer }, patchBay, vizPanel);

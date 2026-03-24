import { AudioEngine } from './engine/AudioEngine.js';
import { OscillatorModule } from './modules/OscillatorModule.js';
import { NoiseModule } from './modules/NoiseModule.js';
import { EnvelopeModule } from './modules/EnvelopeModule.js';
import { FilterModule } from './modules/FilterModule.js';
import { LFOModule } from './modules/LFOModule.js';
import { DelayModule } from './modules/DelayModule.js';
import { OutputModule } from './modules/OutputModule.js';
import { OscillatorPanel } from './ui/OscillatorPanel.js';
import { OutputPanel } from './ui/OutputPanel.js';
import { FilterPanel } from './ui/FilterPanel.js';
import { DelayPanel } from './ui/DelayPanel.js';
import { LFOPanel } from './ui/LFOPanel.js';
import { EnvelopePanel } from './ui/EnvelopePanel.js';
import { SequencerModule } from './modules/SequencerModule.js';
import { SequencerPanel } from './ui/SequencerPanel.js';
import { Rack } from './ui/Rack.js';

const engine = new AudioEngine();
const ctx = engine.context;

const oscillator = new OscillatorModule(ctx);
const noise = new NoiseModule(ctx);
const envelope = new EnvelopeModule(ctx);
const filter = new FilterModule(ctx);
const lfo = new LFOModule(ctx);
const delay = new DelayModule(ctx);
const output = new OutputModule(ctx);
const sequencer = new SequencerModule(ctx);

// Default signal chain: osc → filter → output
// Envelope and delay are toggled via checkboxes
oscillator.connect(filter);
filter.connect(output);

// UI panels
new OscillatorPanel(oscillator);
new OutputPanel(output);
new FilterPanel(filter);
new DelayPanel(delay);
new LFOPanel(lfo);
new EnvelopePanel(envelope);
new SequencerPanel(sequencer);
new Rack(engine, { oscillator, noise, envelope, filter, delay, lfo, output, sequencer });

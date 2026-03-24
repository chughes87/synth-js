import { AudioEngine } from './engine/AudioEngine.js';
import { OscillatorModule } from './modules/OscillatorModule.js';
import { OutputModule } from './modules/OutputModule.js';
import { OscillatorPanel } from './ui/OscillatorPanel.js';
import { OutputPanel } from './ui/OutputPanel.js';
import { Rack } from './ui/Rack.js';

const engine = new AudioEngine();
const oscillator = new OscillatorModule(engine.context);
const output = new OutputModule(engine.context);

oscillator.connect(output);

new OscillatorPanel(oscillator);
new OutputPanel(output);
new Rack(engine, oscillator);

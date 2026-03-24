# Modular Synth — Build Plan

## MVP: Oscillator + Output modules

Goal: a working browser synth where you can hear an oscillator through your speakers, with controls for frequency, waveform, and volume.

### Architecture

- **Web Audio API** as the audio backend
- Each module is a plain JS class with `inputNode` / `outputNode` properties and a `connect(target)` method
- **`AudioEngine`** owns the `AudioContext` singleton (dependency-injected for testability)
- Signal flow: `OscillatorModule → OutputModule → AudioContext.destination`
- Native ESM (`type: module`) — no bundler, no Babel; browser and test files stay identical
- `OscillatorNode` is one-shot by Web Audio API design — `start()` recreates and reconnects it each time
- `AudioEngine.start()` must be called from a click handler (browser autoplay policy)

### Sub-tasks

- [x] **1. Project setup** — `package.json` with Jest + ESM config, `npm install`, verify `npm test` passes with no tests
- [x] **2. AudioEngine** — `src/engine/AudioEngine.js` + `tests/engine/AudioEngine.test.js` + shared `tests/__mocks__/AudioContextMock.js`
- [x] **3. OscillatorModule** — `src/modules/OscillatorModule.js` + `tests/modules/OscillatorModule.test.js`
- [x] **4. OutputModule** — `src/modules/OutputModule.js` + `tests/modules/OutputModule.test.js`
- [x] **5. HTML shell + CSS** — `index.html`, `src/style.css` (dark rack layout)
- [x] **6. UI panels + Rack** — `src/ui/Rack.js`, `src/ui/OscillatorPanel.js`, `src/ui/OutputPanel.js`
- [x] **7. Wire it together** — `src/main.js` instantiates engine, modules, rack, connects osc → output

Each sub-task is its own PR. Start with sub-task 1.

### File structure (target)

```
synth-js/
├── package.json
├── index.html
├── src/
│   ├── engine/AudioEngine.js
│   ├── modules/
│   │   ├── OscillatorModule.js
│   │   └── OutputModule.js
│   ├── ui/
│   │   ├── Rack.js
│   │   ├── OscillatorPanel.js
│   │   └── OutputPanel.js
│   ├── main.js
│   └── style.css
└── tests/
    ├── __mocks__/AudioContextMock.js
    ├── engine/AudioEngine.test.js
    └── modules/
        ├── OscillatorModule.test.js
        └── OutputModule.test.js
```

## Phase 2: Five new modules

Goal: expand the synth with filter, delay, noise generator, LFO, and ADSR envelope — modules + tests + UI + wiring.

### Sub-tasks

- [x] **8. FilterModule** — BiquadFilterNode wrapper (lowpass/highpass/bandpass/notch), frequency + Q controls
- [x] **9. DelayModule** — DelayNode with feedback loop, delay time + feedback controls
- [x] **10. NoiseModule** — white noise via AudioBuffer, start/stop lifecycle
- [x] **11. LFOModule** — low-frequency oscillator that modulates an AudioParam, rate + depth controls
- [x] **12. EnvelopeModule** — ADSR envelope applied to a GainNode
- [x] **13. UI + wiring for new modules** — panels, HTML, CSS, main.js updates

## Phase 3: Sequencer

- [x] **14. SequencerModule** — 16-step sequencer with note selection, BPM control, lookahead scheduling
- [x] **15. SequencerPanel + wiring** — step grid UI, Seq Play/Stop transport, integration with oscillator + envelope

## Phase 4: UX Improvements

### Sub-tasks

- [x] **16. Waveform visualizer** — AnalyserModule + VisualizerPanel using canvas, wired after output to show live waveform
- [ ] **17. Live value displays on sliders** — show current Hz, ms, dB values next to each control
- [ ] **18. Keyboard input** — play notes from computer keyboard
- [ ] **19. Active step highlight** — animate current sequencer step during playback
- [ ] **20. Cable/patch visualization** — show signal flow between modules

## Phase 5: Modular patching

### Sub-tasks

- [x] **21. PatchBay class + tests** — routing engine with audio and modulation connections, validity matrix
- [x] **22. PatchMatrixPanel UI** — grid table to toggle connections, calls PatchBay methods
- [x] **23. Integrate PatchBay into main.js + Rack.js** — replace hardcoded chain and checkboxes
- [x] **24. Split PatchBay into SignalPatchBay + ModPatchBay** — separate audio routing from modulation routing for cleaner architecture
- [x] **25. Dynamic panel DOM generation** — panels create their own DOM, removing hardcoded HTML dependency
- [x] **26. Multi-instance modules** — ModuleRegistry, instance IDs, patch bays use registry, picker allows duplicates
- [ ] **27. Sequencer target dropdown** — routable sequencer

### Verification (end state)

1. `npm test` — all Jest tests pass
2. Open `index.html` in browser
3. Click Start → tone plays through speakers
4. Adjust frequency slider → pitch changes
5. Adjust volume slider → loudness changes
6. Change waveform select → timbre changes
7. Click Stop → tone stops; Start again restarts cleanly

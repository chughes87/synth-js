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
- [ ] **3. OscillatorModule** — `src/modules/OscillatorModule.js` + `tests/modules/OscillatorModule.test.js`
- [ ] **4. OutputModule** — `src/modules/OutputModule.js` + `tests/modules/OutputModule.test.js`
- [ ] **5. HTML shell + CSS** — `index.html`, `src/style.css` (dark rack layout)
- [ ] **6. UI panels + Rack** — `src/ui/Rack.js`, `src/ui/OscillatorPanel.js`, `src/ui/OutputPanel.js`
- [ ] **7. Wire it together** — `src/main.js` instantiates engine, modules, rack, connects osc → output

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

### Verification (end state)

1. `npm test` — all Jest tests pass
2. Open `index.html` in browser
3. Click Start → tone plays through speakers
4. Adjust frequency slider → pitch changes
5. Adjust volume slider → loudness changes
6. Change waveform select → timbre changes
7. Click Stop → tone stops; Start again restarts cleanly

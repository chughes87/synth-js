/**
 * OutputModule controls master volume via a GainNode.
 * Signal flow: inputNode (GainNode) → AudioContext.destination
 */
export class OutputModule {
  constructor(audioContext) {
    this.context = audioContext;
    this.inputNode = audioContext.createGain();
    this.inputNode.connect(audioContext.destination);
  }

  get volume() {
    return this.inputNode.gain.value;
  }

  set volume(value) {
    this.inputNode.gain.value = Math.max(0, Math.min(1, value));
  }
}

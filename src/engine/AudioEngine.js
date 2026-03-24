/**
 * AudioEngine owns the AudioContext singleton.
 * Accepts an AudioContext via constructor for testability.
 */
export class AudioEngine {
  constructor(audioContext) {
    this.context = audioContext ?? new AudioContext();
  }

  get destination() {
    return this.context.destination;
  }

  get state() {
    return this.context.state;
  }

  async start() {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  async stop() {
    if (this.context.state === 'running') {
      await this.context.close();
    }
  }
}

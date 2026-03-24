/**
 * BaseModule provides shared wiring for all audio modules.
 */
export class BaseModule {
  constructor(audioContext) {
    this.context = audioContext;
  }

  connect(target) {
    const destination = target.inputNode ?? target;
    this.outputNode.connect(destination);
  }

  /** Override in subclasses that can be modulation targets. */
  getModParam(_name) {
    return undefined;
  }

  /** Override in subclasses that produce modulation signals (LFO, Envelope). */
  get modOutputNode() {
    return undefined;
  }
}

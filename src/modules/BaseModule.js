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
}

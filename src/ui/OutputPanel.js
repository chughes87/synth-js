import { BasePanel } from './BasePanel.js';

/**
 * Binds the output DOM controls to an OutputModule.
 */
export class OutputPanel extends BasePanel {
  constructor(outputModule) {
    super(outputModule);
    this.bindSlider('output-volume', 'volume', v => v.toFixed(2));

    // Sync initial volume from slider
    this.module.volume = Number(document.getElementById('output-volume').value);
  }
}

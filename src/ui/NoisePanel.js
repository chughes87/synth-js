import { BasePanel } from './BasePanel.js';

export class NoisePanel extends BasePanel {
  constructor(noiseModule, container) {
    super(noiseModule, container);
    this.setTitle('Noise');
  }
}

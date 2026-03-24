import { BasePanel } from './BasePanel.js';

export class NoisePanel extends BasePanel {
  constructor(noiseModule, container, instanceId) {
    super(noiseModule, container, instanceId);
    this.setTitle('Noise');
  }
}

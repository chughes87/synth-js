import { BasePanel } from './BasePanel.js';

export class FilterPanel extends BasePanel {
  constructor(filterModule) {
    super(filterModule);
    this.bindSlider('filter-frequency', 'frequency', v => `${v} Hz`);
    this.bindSlider('filter-q', 'Q', v => v.toFixed(1));
    this.bindSelect('filter-type', 'type');
  }
}

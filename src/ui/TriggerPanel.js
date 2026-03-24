import { BasePanel } from './BasePanel.js';

export class TriggerPanel extends BasePanel {
  constructor(triggerModule, container, instanceId) {
    super(triggerModule, container, instanceId);
    this.setTitle('Trigger');

    const btn = document.createElement('button');
    btn.className = 'trigger-fire-btn';
    btn.textContent = 'Fire';
    btn.addEventListener('click', () => this.module.fire());
    this.el.appendChild(btn);
  }
}

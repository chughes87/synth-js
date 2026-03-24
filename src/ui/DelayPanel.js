export class DelayPanel {
  constructor(delayModule) {
    this.module = delayModule;
    this.timeSlider = document.getElementById('delay-time');
    this.timeValue = document.getElementById('delay-time-value');
    this.feedbackSlider = document.getElementById('delay-feedback');
    this.feedbackValue = document.getElementById('delay-feedback-value');

    this.timeSlider.addEventListener('input', () => this._onTime());
    this.feedbackSlider.addEventListener('input', () => this._onFeedback());
  }

  _onTime() {
    const val = Number(this.timeSlider.value);
    this.module.delayTime = val;
    this.timeValue.textContent = `${val.toFixed(2)} s`;
  }

  _onFeedback() {
    const val = Number(this.feedbackSlider.value);
    this.module.feedback = val;
    this.feedbackValue.textContent = val.toFixed(2);
  }
}

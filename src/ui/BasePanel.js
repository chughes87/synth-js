/**
 * BasePanel provides declarative DOM control binding for module panels.
 */
export class BasePanel {
  constructor(module) {
    this.module = module;
  }

  /**
   * Bind a range slider to a module property.
   * @param {string} id - DOM element ID prefix (slider is #id, display is #id-value)
   * @param {string} prop - Module property name to set
   * @param {function} format - Formats the numeric value for display
   */
  bindSlider(id, prop, format) {
    const slider = document.getElementById(id);
    const display = document.getElementById(`${id}-value`);
    slider.addEventListener('input', () => {
      const val = Number(slider.value);
      this.module[prop] = val;
      display.textContent = format(val);
    });
  }

  /**
   * Bind a select element to a module property.
   * @param {string} id - DOM element ID
   * @param {string} prop - Module property name to set
   */
  bindSelect(id, prop) {
    const select = document.getElementById(id);
    select.addEventListener('change', () => {
      this.module[prop] = select.value;
    });
  }
}

/**
 * BasePanel provides dynamic DOM creation and control binding for module panels.
 * Each panel creates its own DOM subtree inside a given container element.
 */
export class BasePanel {
  constructor(module, container, instanceId) {
    this.module = module;
    this.instanceId = instanceId;
    this.el = document.createElement('div');
    this.el.className = 'module';
    container.appendChild(this.el);
  }

  setTitle(text) {
    const h2 = document.createElement('h2');
    // Append instance number if available
    if (this.instanceId) {
      const type = this.instanceId.replace(/-\d+$/, '');
      const num = this.instanceId.slice(type.length + 1);
      h2.textContent = `${text} ${num}`;
    } else {
      h2.textContent = text;
    }
    this.el.appendChild(h2);
  }

  /**
   * Create a range slider bound to a module property.
   */
  createSlider(label, prop, { min, max, value, step, format }) {
    const wrapper = document.createElement('label');
    const labelText = document.createTextNode(label);
    wrapper.appendChild(labelText);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.value = value;
    input.step = step;

    const display = document.createElement('span');
    display.textContent = format(Number(value));

    input.addEventListener('input', () => {
      const val = Number(input.value);
      this.module[prop] = val;
      display.textContent = format(val);
    });

    wrapper.appendChild(input);
    wrapper.appendChild(display);
    this.el.appendChild(wrapper);

    // Sync initial value to module
    this.module[prop] = Number(value);

    return input;
  }

  /**
   * Create a select element bound to a module property.
   * @param {string} label
   * @param {string} prop
   * @param {Array<{value: string, label: string}>} options
   */
  createSelect(label, prop, options) {
    const wrapper = document.createElement('label');
    const labelText = document.createTextNode(label);
    wrapper.appendChild(labelText);

    const select = document.createElement('select');
    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      this.module[prop] = select.value;
    });

    wrapper.appendChild(select);
    this.el.appendChild(wrapper);

    return select;
  }

  destroy() {
    this.el.remove();
  }
}

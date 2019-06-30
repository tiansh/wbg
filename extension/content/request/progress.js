; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const request = yawf.request = yawf.request || {};

  class Progresser {
    /**
     * @param {number} max
     * @param {number} value
     */
    constructor(max = null, value = null) {
      this.max = max;
      this.value = value;
      /** @type {Funciton[]} */
      this.listenerList = [];
      this.triggerUpdate();
    }
    clear() {
      this.max = this.value = null;
      this.triggerUpdate();
    }
    setMax(max) {
      this.max = max;
      if (!this.value) this.value = 0;
      this.triggerUpdate();
    }
    setValue(value) {
      if (value < 0 || value > this.max) return;
      this.value = value;
      this.triggerUpdate();
    }
    incValue() {
      if (this.value === null) return;
      this.setValue(this.value + 1);
    }
    getMax() { return this.max; }
    getValue() { return this.value; }
    addUpdateListener(listener) {
      if (this.listenerList.includes(listener)) return;
      this.listenerList.push(listener);
    }
    triggerUpdate() {
      this.listenerList.forEach(listener => {
        try {
          listener({ max: this.max, value: this.value });
        } catch (e) {
          util.debug('Failed to execute Progresser listener: %o', e);
        }
      });
    }
  }

  request.Progresser = Progresser;

}());


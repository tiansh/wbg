; (function () {

  const yawf = window.yawf;

  const rule = yawf.rule;
  const util = yawf.util;

  const css = util.css;

  /**
   * 一个日期框
   * 允许定义 min, max 属性
   * 对应一个 date 输入框
   */
  class DateConfigItem extends rule.class.InputConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    get inputType() { return 'date'; }
    get initial() {
      const today = new Date(Date.now() + 288e5).toISOString().split('T')[0];
      const notmin = this.min && this.min > today ? this.min : today;
      const notmax = this.max && this.max < notmin ? this.max : notmin;
      return notmax;
    }
    get min() { return ''; }
    get max() { return ''; }
    normalize(value) {
      if (!/\d{4}-\d\d-\d\d/.test(value)) return this.initial;
      let date = value;
      if (+this.min === this.min && date < this.min) date = this.min;
      if (+this.max === this.max && date > this.max) date = this.max;
      return date;
    }
    render() {
      const container = super.render();
      const input = container.querySelector('input');
      if (this.min) input.min = this.min;
      if (this.max) input.max = this.max;
      return container;
    }
  }
  rule.class.DateConfigItem = DateConfigItem;
  rule.types.date = DateConfigItem;


  class FilterRule extends rule.class.Rule {
    constructor(item) {
      super(item);
    }
    get type() { return 'filter'; }
    render(...args) {
      /** @type {HTMLElement} */
      const container = super.render(...args);
      const label = container.firstChild;
      const remain = container.appendChild(document.createElement('span'));
      remain.className = 'yawf-filter-rule-detail';
      while (label.nextSibling !== remain) {
        remain.appendChild(label.nextSibling);
      }
      this.renderValue(container);
      return container;
    }
    /** @param {HTMLElement} container */
    renderValue(container) {
      const remain = container.querySelector('.yawf-filter-rule-detail');
      if (this.getConfig()) {
        remain.style.display = 'block';
      } else {
        remain.style.display = 'none';
      }
    }
    filter(item) { return true; }
  }
  rule.class.FilterRule = FilterRule;
  rule.FilterRule = function (item) {
    const result = new FilterRule(item);
    if (rule.inited) result.execute();
    return result;
  };

  class FilterRuleCollection {
    /** @param {string} view */
    constructor(viewList) {
      this.rules = rule.query({ filter: rule => rule.type === 'filter' && viewList.includes(rule.view) });
      this.filter = this.filter.bind(this);
    }
    filter(item) {
      return this.rules.every(rule => rule.filter(item));
    }
  }
  rule.FilterRuleCollection = function (view) {
    return new FilterRuleCollection(view);
  };

  css.append(`
.yawf-filter-rule-detail { margin-left: 10px; }
.yawf-filter-rule-detail label { margin-left: 10px; }
`);

}());

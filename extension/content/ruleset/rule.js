; (function () {

  const yawf = window.yawf;

  const rule = yawf.rule;
  const util = yawf.util;

  const css = util.css;

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

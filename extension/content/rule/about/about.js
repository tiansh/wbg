; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.aboutTabTitle = {
    cn: '关于冰糕',
    tw: '關於冰糕',
    en: 'About',
  };

  const about = yawf.rules.about = {};
  about.about = rule.Tab({
    template: () => i18n.aboutTabTitle,
  });

}());

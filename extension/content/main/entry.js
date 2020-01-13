; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;

  const i18n = util.i18n;

  const rule = yawf.rule;

  i18n.filterMenuItem = {
    cn: '冰糕设置',
    tw: '冰糕設定',
    en: 'Tools Settings',
  };

  const onClick = function (e) {
    try {
      rule.dialog(null, rule => !rule.view);
    } catch (e) { util.debug('Error while prompting dialog: %o', e); }
    e.preventDefault();
  };

  init.onLoad(() => {
    const menuitem = function () {
      const menuitems = document.querySelectorAll('.gn_topmenulist ul li.line');
      if (!menuitems || !menuitems.length) { setTimeout(menuitem, 100); return; }
      const reference = [...menuitems].pop();
      const ul = document.createElement('ul');
      ul.innerHTML = `
  <li class="line S_line1 yawf-config-menuline"></li>
  <li><a href="javascript:void(0);" class="wbg-config-menuitem"></a></li>
`;
      const item = ul.querySelector('.wbg-config-menuitem');
      item.addEventListener('click', onClick);
      item.textContent = i18n.filterMenuItem;
      reference.before(...ul.children);
    };
    menuitem();
  });

}());


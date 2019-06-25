; (async function () {

  const yawf = window.yawf;
  const observer = yawf.observer;
  const util = yawf.util;

  const css = util.css;
  const ui = util.ui;
  const i18n = util.i18n;

  const wbg = window.wbg = window.wbg || {};
  const batch = wbg.batch = wbg.batch || {};

  const progress = batch.progress = {};

  Object.assign(i18n, {
    pageProgress: {
      cn: '第{index}页 / 共{count}页',
    },
    itemProgress: {
      cn: '第{index}项 / 共{count}项',
    },
  });

  progress.start = function (config) {
    const renderProgress = function (progresser, container, template) {
      const bar = container.querySelector('.wbg-progress-bar');
      const text = container.querySelector('.wbg-progress-text');
      const updateProgress = function () {
        const value = progresser.getValue();
        const max = progresser.getMax();
        // index 表示已经处理完成几个，加一就表示目前在处理第几个
        if (value != null) bar.value = Math.min(max, value);
        else bar.removeAttribute('value');
        if (max != null) bar.max = max;
        else bar.removeAttribute('max');
        text.textContent = template
          .replace('{index}', () => value == null ? 0 : Math.min(max, value + 1))
          .replace('{count}', () => max == null ? '?' : max);
      };
      updateProgress();
      progresser.addUpdateListener(() => { updateProgress(); });
    };
    const progressDialog = ui.dialog({
      id: 'wbg-progress',
      title: config.dialog.title,
      render(inner) {
        inner.classList.add('wbg-progress-content');
        inner.innerHTML = `
<div class="wbg-progress-header"></div>
<div class="wbg-progress-body">
<div class="wbg-progress-container wbg-progress-page">
<progress class="wbg-progress-bar"></progress>
<div class="wbg-progress-text"></div>
</div>
<div class="wbg-progress-container wbg-progress-item">
<progress class="wbg-progress-bar"></progress>
<div class="wbg-progress-text"></div>
</div>
</div>
`;
        const header = inner.querySelector('.wbg-progress-header');
        header.textContent = config.dialog.header;
        const page = inner.querySelector('.wbg-progress-page');
        const item = inner.querySelector('.wbg-progress-item');
        const progress = config.fetcher.getProgres();
        renderProgress(progress.page, page, i18n.pageProgress);
        renderProgress(progress.item, item, i18n.itemProgress);
      },
      button: {
        close() { /* nothing */ },
      },
    });
    progressDialog.show();
    return progressDialog;
  };

  css.append(`
#wbg-progress .ficon_close { display: none; }
.wbg-progress-content { width: 600px; overflow: auto; }
.wbg-progress-header { padding: 20px 20px 0; }
.wbg-progress-body { padding: 30px 10px 10px; }
.wbg-progress-container { width: calc(100% - 20px); line-height: 30px; padding: 20px 10px; }
.wbg-progress-bar { width: 100%; height: 15px; }
.wbg-progress-text { text-align: center; }
`);


}());

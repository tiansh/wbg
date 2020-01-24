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
    progressShowDetail: {
      cn: '查看详细信息',
    },
    logItemProcessing: { cn: '……' },
    logItemSuccess: { cn: '完成' },
    logItemFail: { cn: '失败' },
    logItemSkip: { cn: '跳过' },
    logItemRetry: { cn: '重试' },
  });

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
  const renderLog = function (log, list, render, fetcher) {
    const container = list.parentNode;
    log.onUpdateStatus(function (item, status, oldStatus, log) {
      if (!log.li) {
        const li = document.createElement('li');
        li.className = 'wbg-progress-detail-item';
        li.innerHTML = `
<span class="wbg-progress-detail-item-title"></span>
<span class="wbg-progress-detail-item-status"><span></span></span>
`;
        const liTitle = li.querySelector('.wbg-progress-detail-item-title');
        liTitle.appendChild(render(item));
        const onLatest = container.scrollHeight - container.clientHeight - container.scrollTop < 10;
        list.appendChild(li);
        if (onLatest) {
          container.scrollTop = container.scrollHeight - container.clientHeight;
        }
        log.li = li;
      }
      const li = log.li;
      li.className = 'wbg-progress-detail-item wbg-progress-detail-item-' + status;
      const liStatus = li.querySelector('.wbg-progress-detail-item-status');
      liStatus.firstChild.textContent = {
        processing: i18n.logItemProcessing,
        success: i18n.logItemSuccess,
        fail: i18n.logItemFail,
        skip: i18n.logItemSkip,
      }[status];
      if (status === 'fail') {
        const retryButton = document.createElement('a');
        retryButton.href = 'javascript:;';
        retryButton.textContent = i18n.logItemRetry;
        retryButton.addEventListener('click', event => {
          retryButton.remove();
          fetcher.retry(item);
        });
        liStatus.appendChild(retryButton);
      }
    });
  };
  progress.start = function (config) {
    const progressDialog = ui.dialog({
      id: 'wbg-progress',
      title: config.dialog.title,
      render(/** @type {Element} */inner) {
        inner.classList.add('wbg-progress-content');
        inner.innerHTML = `
<div class="wbg-progress-header"></div>
<div class="wbg-progress-bars">
<div class="wbg-progress-container wbg-progress-page">
<div class="wbg-progress-bar-container"><progress class="wbg-progress-bar"></progress></div>
<div class="wbg-progress-text"></div>
</div>
<div class="wbg-progress-container wbg-progress-item">
<div class="wbg-progress-bar-container"><progress class="wbg-progress-bar"></progress></div>
<div class="wbg-progress-text"></div>
</div>
<div class="wbg-progress-detail wbg-progress-detail-fold">
<div class="wbg-progress-detail-show-button-container">
<a href="javascript:;" class="W_btn_b wbg-progress-detail-show-button"><span class="W_f14"></span></a>
</div>
<div class="wbg-progress-detail-content">
<ol class="wbg-progress-detail-list"></ol>
</div>
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
        const showButton = inner.querySelector('.wbg-progress-detail-show-button');
        const detail = inner.querySelector('.wbg-progress-detail');
        const list = inner.querySelector('.wbg-progress-detail-list');
        const log = config.fetcher.getLog();
        showButton.querySelector('span').textContent = i18n.progressShowDetail;
        showButton.addEventListener('click', function (event) {
          detail.classList.remove('wbg-progress-detail-fold');
          detail.classList.add('wbg-progress-detail-show');
          progressDialog.resetPosition();
        });
        renderLog(log, list, config.render.log, config.fetcher);
      },
      button: {
        close() {
          if (config.isDelete) {
            location.reload();
          } else {
            progressDialog.hide();
          }
        },
      },
    });
    progressDialog.show();
    progressDialog.finish = function () {
      const dom = progressDialog.dom;
      const close = dom.querySelector('.ficon_close');
      close.style.display = 'inline';
    };
    return progressDialog;
  };

  css.append(`
#wbg-progress .ficon_close { display: none; }
.wbg-progress-content { width: 600px; overflow: auto; }
.wbg-progress-header { padding: 10px 20px 0; }
.wbg-progress-bars { padding: 10px; }
.wbg-progress-container { padding: 0 10px; line-height: 30px; display: flex; }
.wbg-progress-bar-container { flex: 1 1 auto; }
.wbg-progress-bar { width: 100%; height: 15px; }
.wbg-progress-text { text-align: center; flex-basis: 150px; }
.wbg-progress-detail { padding: 10px; }
.wbg-progress-detail-show .wbg-progress-detail-show-button-container { display: none; }
.wbg-progress-detail-fold .wbg-progress-detail-content { display: none; }
.wbg-progress-detail-content { border: 1px solid #ccc; height: 300px; overflow: auto; }
.wbg-progress-detail-item { display: flex; padding: 5px 0; border-bottom: 1px solid #ccc; }
.wbg-progress-detail-item-title { flex: 1 1 auto; padding-left: 10px; }
.wbg-progress-detail-item-status { flex: 0 0 60px; text-align: right; padding-right: 10px; }
.wbg-progress-detail-item-processing { background: rgba(163, 197, 240, 0.32); }
.wbg-progress-detail-item-success { background: rgba(163, 240, 168, 0.32); }
.wbg-progress-detail-item-fail { background: rgba(240, 163, 167, 0.32); }
.wbg-progress-detail-item-skip { background: rgba(0, 0, 0, 0.06); }
.wbg-progress-detail-item-status a { display: none; }
.wbg-progress-detail-item-fail:hover .wbg-progress-detail-item-status span { display: none; }
.wbg-progress-detail-item-fail:hover .wbg-progress-detail-item-status a { display: inline; }
`);


}());

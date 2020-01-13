; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const rules = yawf.rules;
  const request = yawf.request;
  const feedParser = yawf.feed;

  const ui = util.ui;
  const i18n = util.i18n;
  const css = util.css;

  const wbg = window.wbg;
  const batch = wbg.batch;


  const feedDelete = batch.feedDelete = {};

  Object.assign(i18n, {
    feedDeleteDialogTitle: {
      cn: '批量微博删除 - 微博冰糕',
    },
    feedDeleteDialogHeader: {
      cn: '您发出的微博共 {total} 页，您当前正在查看第 {current} 页',
    },
    feedDeleteProgressDialogHeader: {
      cn: '正在删除自己发出的微博，请勿关闭该标签页。删除期间请勿发布新微博。',
    },
    feedDeleteFinish: {
      cn: '已删除您发出的微博',
    },
    feedDeleteLogItem: {
      cn: '删除微博 {}',
    },
  });

  const logRender = function (feed) {
    const id = feedParser.mid(feed);
    const container = document.createElement('span');
    i18n.feedDeleteLogItem.split(/({})/).forEach(text => {
      if (text === '{}') container.appendChild(document.createTextNode(id));
      else container.appendChild(document.createTextNode(text));
    });
    return container;
  };

  const deleteFeeds = async function ({ url, first }) {
    const filter = rule.FilterRuleCollection(['feedDelete', 'feedFilter']).filter;
    const fetcher = new request.ProfileFeedDeleter({ first, filter }, { url: new URL(url) });
    const progressDialog = batch.progress.start({
      dialog: {
        title: i18n.feedDeleteDialogTitle,
        header: i18n.feedDeleteProgressDialogHeader,
      },
      fetcher,
      render: { log: logRender },
      isDelete: true,
    });
    await fetcher.consume(async feed => {
      const mid = feed.getAttribute('mid');
      const success = await request.deleteFeed(mid);
      util.debug('Batch delete feed: %o [%s]', mid, success ? 'success' : 'FAIL');
      return success;
    });
    progressDialog.finish();
    await ui.alert({
      id: 'wbg-feed-delete-success',
      icon: 'succ',
      title: i18n.feedDeleteDialogTitle,
      text: i18n.feedDeleteFinish,
    });
  };

  feedDelete.showDialog = function ({ url, current, total }) {
    const feedDeleteConfigDialog = ui.dialog({
      id: 'wbg-feed-delete-outbox',
      title: i18n.feedDeleteDialogTitle,
      render(inner) {
        inner.classList.add('wbg-feed-delete-content');
        inner.innerHTML = `
<div class="wbg-feed-delete-header"></div>
<div class="wbg-feed-delete-body"></div>
`;

        const ruleItems = rule.query({
          filter: item => ['feedDelete', 'feedFilter'].includes(item.view),
        });
        const header = inner.querySelector('.wbg-feed-delete-header');
        header.textContent = i18n.feedDeleteDialogHeader
          .replace('{current}', current).replace('{total}', total);
        const body = inner.querySelector('.wbg-feed-delete-body');

        const pages = rules.feedDelete.range.pages;
        pages.ref.first.current = current;

        rule.render(body, ruleItems);

      },
      button: {
        ok: function () {
          feedDeleteConfigDialog.hide();
          deleteFeeds({ url, first: current });
        },
        cancel: function () {
          feedDeleteConfigDialog.hide();
        },
      },
    });
    feedDeleteConfigDialog.show();
  };

  css.append(`
.wbg-feed-delete-content { width: 600px; height: 300px; overflow: auto; }
.wbg-feed-delete-header { padding: 20px 20px 0; }
.wbg-feed-delete-body { padding: 10px; }
`);

}());

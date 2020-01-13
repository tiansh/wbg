; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const rules = yawf.rules;
  const request = yawf.request;
  const downloader = yawf.downloader;
  const feedParser = yawf.feed;

  const ui = util.ui;
  const i18n = util.i18n;
  const css = util.css;
  const timestamp = util.timestamp;
  const mid = util.mid;

  const wbg = window.wbg;
  const batch = wbg.batch;

  const feedDownload = batch.feedDownload = {};

  Object.assign(i18n, {
    feedDownloadDialogTitle: {
      cn: '批量微博下载 - 微博冰糕',
    },
    feedDownloadDialogHeader: {
      cn: '当前微博列表共 {total} 页，您现在在第 {current} 页',
    },
    feedDownloadProgressDialogHeader: {
      cn: '正在下载，第{first}～{last}页微博；下载过程中请勿关闭该标签页',
    },
    feedDownloadFinish: {
      cn: '选定的下载已完成，请到浏览器的下载目录查看',
    },
    feedDownloadLogItem: {
      cn: '下载微博 {}',
    },
  });

  const logRender = function (feed) {
    const id = feedParser.mid(feed);
    const author = feedParser.author.id(feed);
    const host = location.hostname === 'www.weibo.com' ? 'www.weibo.com' : 'weibo.com';
    const url = `https://${host}/${author}/${mid.encode(id)}`;
    const container = document.createElement('span');
    const link = document.createElement('a');
    link.href = url;
    link.textContent = id;
    link.target = '_blank';
    i18n.feedDownloadLogItem.split(/({})/).forEach(text => {
      if (text === '{}') container.appendChild(link);
      else container.appendChild(document.createTextNode(text));
    });
    return container;
  };

  const startDownload = async function ({ url, first, last }) {
    const filter = rule.FilterRuleCollection(['feedDownload', 'feedFilter']).filter;
    const fetcher = new request.ProfileFeedFetcher({ first, last, filter }, { url: new URL(url) });
    const progressDialog = batch.progress.start({
      dialog: {
        title: i18n.feedDownloadDialogTitle,
        header: i18n.feedDownloadProgressDialogHeader
          .replace('{first}', () => first)
          .replace('{last}', () => last),
      },
      fetcher,
      render: { log: logRender },
    });
    const feedDownloader = new downloader.FeedDownloader({
      path: `./wbg/feed/batch-${timestamp.getDateTime()}/$author/$year$month/`,
    });
    await fetcher.consume(async feed => {
      const { author, mid } = downloader.FeedDownloader.getFeedInfo(feed);
      const oid = fetcher.getConfig().oid;
      if (author !== oid) return null;
      const success = await feedDownloader.download(author, mid);
      return success;
    });
    progressDialog.finish();
    ui.alert({
      id: 'wbg-feed-download-success',
      icon: 'succ',
      title: i18n.feedDownloadDialogTitle,
      text: i18n.feedDownloadFinish,
    });

  };

  feedDownload.showDialog = function ({ url, current, total }) {
    const downloadConfigDialog = ui.dialog({
      id: 'wbg-feed-download',
      title: i18n.feedDownloadDialogTitle,
      render(inner) {
        inner.classList.add('wbg-feed-download-content');
        inner.innerHTML = `
<div class="wbg-feed-download-header"></div>
<div class="wbg-feed-download-body"></div>
`;
        const ruleItems = rule.query({
          filter: item => ['feedDownload', 'feedFilter'].includes(item.view),
        });
        const header = inner.querySelector('.wbg-feed-download-header');
        header.textContent = i18n.feedDownloadDialogHeader
          .replace('{current}', current).replace('{total}', total);
        const body = inner.querySelector('.wbg-feed-download-body');

        const pages = rules.feedDownload.range.pages;
        const { first, last } = pages.ref;
        first.current = last.current = current;
        first.total = last.total = total;
        last.setConfig(total);

        rule.render(body, ruleItems);
      },
      button: {
        ok: function () {
          downloadConfigDialog.hide();
          const last = rules.feedDownload.range.pages.ref.last.getConfig();
          startDownload({ url, first: current, last });
        },
        cancel: function () {
          downloadConfigDialog.hide();
        },
      },
    });
    downloadConfigDialog.show();
  };

  css.append(`
.wbg-feed-download-content { width: 600px; height: 300px; overflow: auto; }
.wbg-feed-download-header { padding: 20px 20px 0; }
.wbg-feed-download-body { padding: 10px; }
`);

}());

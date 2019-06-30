; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const contextmenu = yawf.contextmenu;
  const feedParser = yawf.feed;
  const downloader = yawf.downloader;

  const wbg = window.wbg;
  const batch = wbg.batch;

  const i18n = util.i18n;
  const css = util.css;

  i18n.downloadTabTitle = {
    cn: '微博下载',
    tw: '微博下載',
    en: 'Feed Download',
  };

  const feedDownload = yawf.rules.feedDownload = {};
  feedDownload.feedDownload = rule.Tab({
    template: () => i18n.downloadTabTitle,
  });

  i18n.contentGroupTitle = {
    cn: '下载內容',
    tw: '下載内容',
    en: 'Download Content',
  };

  const content = feedDownload.content = {};
  content.content = rule.Group({
    parent: feedDownload.feedDownload,
    template: () => i18n.contentGroupTitle,
  });

  Object.assign(i18n, {
    downloadAsText: {
      cn: '使用文本格式存储',
    },
    downloadAsHtml: {
      cn: '使用 HTML 格式存储',
    },
    downloadImage: {
      cn: '同时下载图片',
    },
    downloadVideo: {
      cn: '同时下载视频',
    },
  });

  content.downloadAsText = rule.Rule({
    id: 'download_as_text',
    version: 1,
    parent: content.content,
    initial: true,
    template: () => i18n.downloadAsText,
    init() {
      this.addConfigListener(config => {
        if (!config) content.downloadAsHtml.setConfig(true);
      });
    },
  });

  content.downloadAsHtml = rule.Rule({
    id: 'download_as_html',
    version: 1,
    parent: content.content,
    template: () => i18n.downloadAsHtml,
    ref: {
      optimize: { type: 'boolean', initial: true },
    },
    init() {
      this.addConfigListener(config => {
        if (!config) content.downloadAsText.setConfig(true);
      });
    },
  });

  content.downloadImage = rule.Rule({
    id: 'download_image',
    version: 1,
    parent: content.content,
    initial: true,
    template: () => i18n.downloadImage,
  });

  content.downloadVideo = rule.Rule({
    id: 'download_video',
    version: 1,
    parent: content.content,
    template: () => i18n.downloadVideo,
  });

  i18n.singleDownloadGroupTitle = {
    cn: '单条下载',
  };

  const single = feedDownload.single = {};
  single.single = rule.Group({
    parent: feedDownload.feedDownload,
    template: () => i18n.singleDownloadGroupTitle,
  });

  Object.assign(i18n, {
    downloadOnFeedMenu: {
      cn: '在微博右上的菜单中添加下载菜单项',
    },
    downloadOnContextMenu: {
      cn: '在微博右键菜单中添加下载菜单项',
    },
    downloadFeed: {
      cn: '下载微博',
    },
  });

  content.downloadOnFeedMenu = rule.Rule({
    id: 'download_on_feed_menu',
    version: 1,
    parent: single.single,
    initial: true,
    template: () => i18n.downloadOnFeedMenu,
    ainit() {
      observer.feed.add(function (feed) {
        const [author, mid] = downloader.FeedDownloader.getFeedInfo(feed) || [];
        if (!author || !mid) return;
        const menu = feed.querySelector('[node-type="fl_menu_right"] ul:not([node-type="hide"])');
        if (!menu) return;
        const ul = document.createElement('ul');
        ul.innerHTML = '<li><a href="javascript:void(0)"></a></li>';
        const a = ul.querySelector('a');
        a.title = a.textContent = i18n.downloadFeed;
        a.addEventListener('click', event => {
          if (!event.isTrusted) return;
          const feedDownloader = new downloader.FeedDownloader('./wbg/feed/single/');
          feedDownloader.download(author, mid);
        });
        menu.insertBefore(ul.firstChild, menu.firstChild);
      });
    },
  });

  content.downloadOnContextMenu = rule.Rule({
    id: 'download_on_context_nemu',
    version: 1,
    parent: single.single,
    initial: true,
    template: () => i18n.downloadOnContextMenu,
    ainit() {
      contextmenu.addListener(function (/** @type {MouseEvent} */event) {
        const feed = event.target.closest('[mid]');
        if (!feed) return [];
        const [author, mid] = downloader.FeedDownloader.getFeedInfo(feed) || [];
        if (!author || !mid) return [];
        return [{
          title: i18n.downloadFeed,
          onclick() {
            const feedDownloader = new downloader.FeedDownloader('./wbg/feed/single/');
            feedDownloader.download(author, mid);
          },
        }];
      });
    },
  });

  i18n.batchFeedDownloadGroupTitle = {
    cn: '批量下载',
  };

  const batchGroup = feedDownload.batch = {};
  batchGroup.batch = rule.Group({
    parent: feedDownload.feedDownload,
    template: () => i18n.batchFeedDownloadGroupTitle,
  });

  Object.assign(i18n, {
    batchFeedDownload: {
      cn: '批量微博下载',
    },
    downloadOnPageSelector: {
      cn: '在个人主页微博列表翻页选择处显示批量下载功能',
    },
  });

  batchGroup.downloadOnPageSelector = rule.Rule({
    id: 'download_on_page_selector',
    version: 1,
    parent: batchGroup.batch,
    initial: true,
    template: () => i18n.downloadOnPageSelector,
    ainit() {
      batch.handler.add({
        type: 'feed',
        name: i18n.batchFeedDownload,
        context(container) {
          return Boolean(container.closest('[id^="Pl_Official_MyProfileFeed__"]'));
        },
        handler(param) {
          batch.feedDownload.showDialog(param);
        },
      });
    },
  });

  i18n.batchFeedRangeGroupTitle = {
    cn: '下载范围',
  };

  const range = feedDownload.range = {};
  range.range = rule.Group({
    parent: feedDownload.feedDownload,
    template: () => i18n.batchFeedRangeGroupTitle,
  });

  css.append('');

  Object.assign(i18n, {
    batchFeedRangePage: {
      cn: '下载从第{{first}}页到第{{last}}页的微博',
    },
  });

  range.pages = rule.Rule({
    id: 'download_page_range',
    version: 1,
    parent: range.range,
    initial: true,
    template: () => i18n.batchFeedRangePage,
    disabled: true,
    feedDownload: true,
    always: true,
    ref: {
      first: {
        render() {
          return document.createTextNode(this.current);
        },
      },
      last: {
        type: 'number',
        get min() {
          return this.current;
        },
        get max() {
          return this.total;
        },
      },
    },
  });


}());

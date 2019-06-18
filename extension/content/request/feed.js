; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const request = yawf.request = yawf.request || {};

  const dom = util.dom;

  // 获取单条微博
  const getFeed = async function (author, mid) {
    const requestUrl = new URL(`https://weibo.com/${author}/${util.mid.encode(mid)}`);
    const html = await fetch(requestUrl, { credentials: 'include' }).then(r => r.text());
    const domParser = new DOMParser();
    const page = domParser.parseFromString(html, 'text/html');
    const scripts = Array.from(page.querySelectorAll('script'));
    let feedModel = null;
    scripts.find(script => {
      try {
        const content = script.textContent.match(/^\s*FM\.view\((\{.*\})\);?\s*$/);
        if (!content) return false;
        const model = JSON.parse(content[1]);
        if (model.ns !== 'pl.content.weiboDetail.index') return false;
        feedModel = model;
        return true;
      } catch (e) {
        return false;
      }
    });
    if (!feedModel) return null;
    const feed = domParser.parseFromString(feedModel.html, 'text/html').querySelector('[mid]');
    const unfoldList = Array.from(feed.querySelectorAll('[action-type="fl_unfold"]'));
    await Promise.all(unfoldList.map(async unfold => {
      try {
        const mid = new URLSearchParams(unfold.getAttribute('action-data')).get('mid');
        const longHtml = await request.getLongText(mid);
        dom.content(unfold.parentNode, longHtml);
      } catch (e) {
        unfold.remove();
      }
    }));
    return feed;
  };
  request.getFeed = getFeed;

}());

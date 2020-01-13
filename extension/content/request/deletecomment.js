; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const request = yawf.request = yawf.request || {};

  let lastTimestamp = null;
  // 获取单条微博
  const deleteComment = async function (commentId, page = 1) {
    const hostName = location.hostname === 'www.weibo.com' ? 'www.weibo.com' : 'weibo.com';
    const requestUrl = new URL(`https://${hostName}/aj/comment/del?ajwvr=6`);
    if (!lastTimestamp) lastTimestamp = Date.now(); else lastTimestamp++;
    requestUrl.searchParams.set('__rnd', lastTimestamp);
    const body = new URLSearchParams();
    body.set('cid', commentId);
    body.set('_t', 0);
    try {
      // 服务器端需要 Origin 和 Referer 以使请求正常工作，Firefox 要求只能用 content.fetch()
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#XHR_and_Fetch
      const resp = await content.fetch(requestUrl, {
        method: 'POST',
        credentials: 'include',
        body,
      }).then(r => r.json());
      return resp.code === '100000';
    } catch (e) {
      return false;
    }
  };
  request.deleteComment = deleteComment;

}());

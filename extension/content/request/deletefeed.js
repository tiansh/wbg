; (async function () {

  const yawf = window.yawf;
  const request = yawf.request = yawf.request || {};

  const deleteFeed = async function (mid) {
    const hostName = location.hostname === 'www.weibo.com' ? 'www.weibo.com' : 'weibo.com';
    const requestUrl = new URL(`https://${hostName}/aj/mblog/del?ajwvr=6`);
    const body = new URLSearchParams();
    body.set('mid', mid);
    try {
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
  request.deleteFeed = deleteFeed;

}());

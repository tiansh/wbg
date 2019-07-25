; (function () {

  const yawf = window.yawf;
  const observer = yawf.observer;
  const util = yawf.util;

  const css = util.css;

  const wbg = window.wbg = window.wbg || {};
  const batch = wbg.batch = wbg.batch || {};

  const handler = batch.handler = {};

  /** @typedef {'feed'|'comment'} HandlerType */
  /** @type {Map<HandlerType, { name: string, handler: Function, context: Function? }[]>} */
  const handlers = new Map();

  observer.dom.add(function () {
    const pages = document.querySelector('.W_pages:not([wbg-pages])');
    if (!pages) return;
    pages.setAttribute('wbg-pages', 'wbg-pages');
    const pagesRef = pages.parentNode;
    const linkRef = pages.querySelector('a.page.prev[href*="page"], a.page.next[href*="page"]');
    if (!linkRef) return;
    const allPages = Array.from(pages.querySelectorAll('a[href*="page"]'));
    const link = new URL(linkRef.href);
    const currentPage = Number(link.searchParams.get('page')) + (linkRef.classList.contains('prev') ? 1 : -1);
    if (!currentPage) return;
    const totalPage = allPages.reduce((prev, page) => (
      Math.max(prev, Number(new URL(page.href).searchParams.get('page')) || 0)
    ), currentPage);
    const itemListName = link.searchParams.get('pids');
    if (!/^[a-z\d_]+$/i.test(itemListName)) return;
    const itemList = document.querySelector(`[id*="${itemListName}"i]`);
    if (!itemList) return;
    const isFeed = itemList.querySelector('[node-type="feed_list"]');
    const isComment = itemList.querySelector('[node-type="comment_lists"]');
    if (!isFeed && !isComment) return;
    const batchContainer = pagesRef.cloneNode(false);
    batchContainer.classList.add('wbg-batch-handler');
    if (isFeed) batchContainer.classList.add('wbg-batch-feed');
    if (isComment) batchContainer.classList.add('wbg-batch-comment');
    link.searchParams.set('page', currentPage);
    link.hash = '';
    batchContainer.dataset.url = link.href;
    batchContainer.dataset.current = currentPage;
    batchContainer.dataset.total = totalPage;
    pagesRef.parentNode.insertBefore(batchContainer, pagesRef.nextSibling);
    const typeName = isFeed ? 'feed' : isComment ? 'comment' : null;
    const fitHandlers = typeName ? handlers.get(typeName) : [];
    fitHandlers.forEach(handler => {
      addHandler(batchContainer, handler);
    });
  });

  /**
   * @param {object} config
   * @param {HandlerType} config.type
   * @param {string} config.name
   * @param {string} config.handler
   * @param {Function} config.context
   */
  handler.add = function ({ type, name, handler, context }) {
    let selector;
    if (type === 'feed') selector = '.wbg-batch-feed';
    if (type === 'comment') selector = '.wbg-batch-comment';
    Array.from(document.querySelectorAll(selector)).forEach(container => {
      addHandler(container, { name, handler });
    });
    if (!handlers.has(type)) handlers.set(type, []);
    handlers.get(type).push({ name, handler, context });
  };

  const addHandler = function (container, { name, handler, context }) {
    if (context && !context(container)) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = '<a class="wbg-batch-button S_txt1" href="javascript:;"></a>';
    const button = wrap.firstChild;
    button.textContent = name;
    button.addEventListener('click', event => {
      if (!event.isTrusted) return;
      const { url, current, total } = container.dataset;
      handler({ url, current: Number(current), total: Number(total) });
    });
    container.appendChild(button);
  };

  css.append(`
.wbg-batch-handler {
    padding: 4px 0;
    text-align: center;
}
.wbg-batch-handler:empty {
  display: none;
}
.wbg-batch-button {
    letter-spacing: normal;
    word-spacing: normal;
    text-rendering: auto;
    padding: 0 8px;
    margin: 0 5px 0;
    line-height: 20px;
    display: inline-block;
    text-align: center;
    vertical-align: middle;
}
`);

}());

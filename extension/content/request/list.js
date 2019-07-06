; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const request = yawf.request = yawf.request || {};

  const parse = util.parse;

  const Progresser = request.Progresser;

  class ListFetcher {
    constructor({ url, first, last, delay = 5000 }) {
      this.url = new URL(url);
      this.first = Number(first);
      this.last = Number(last);
      this.delay = delay;
      this.buffer = [];
      this.consumed = false;
      this.pageProgress = new Progresser(this.last - this.first + 1);
      this.itemProgress = new Progresser();
    }
    async *fetch() {
      this.pageProgress.setValue(0);
      for (let page = this.first; ; page++) {
        const url = new URL(this.url);
        url.searchParams.set('page', page);
        const html = await fetch(url.href, { credentials: 'same-origin' }).then(resp => resp.text());
        const dom = new DOMParser().parseFromString(html, 'text/html');
        this.current = { html, dom };
        yield* this.getPageItems();
        this.pageProgress.incValue();
        if (page === this.last) break;
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    async *getPageItems() {
      const fetcher = this;
      fetcher.initialPage();
      const items = fetcher.getItemsOnPage();
      let lazy = null, index = 0;
      // 这里的 async 表示我们一边勤快地处理懒加载
      ; (async function updateLazy() {
        try {
          while (true) {
            fetcher.itemProgress.setMax(items.length);
            lazy = fetcher.getLazyLoadItems();
            if (!lazy) break;
            const newItems = await lazy;
            items.push(...newItems);
          }
        } catch (e) {
          lazy = Promise.reject(e);
        }
      }());
      // 一边逐个处理单条数据
      fetcher.itemProgress.setValue(0);
      while (true) {
        if (index < items.length) {
          // 目前有待处理的数据那么拿出来处理
          yield items[index];
          index++;
          fetcher.itemProgress.setValue(index);
        } else if (lazy) {
          // 如果数据还没来那么我们等会儿它
          // 这个 await 必须在上面
          await Promise.resolve(lazy);
        } else {
          // 这一页处理完了
          fetcher.itemProgress.clear();
          return;
        }
      }
    }
    /**
     * 在获取一个页面之后初始化时调用
     */
    initialPage() {}
    /**
     * 获取加载来的第一页上的东西
     */
    getItemsOnPage() { return []; }
    /**
     * 返回 null 如果已经没有可加载的内容了
     * 返回 Promise<any[]> 如果有东西（至少看起来有东西）可加载
     * @returns {null|Promise<any[]>}
     */
    getLazyLoadItems() {
      return null;
    }
    async consume(consumer) {
      if (this.consumed) return;
      this.consumed = true;
      for await (let item of this.fetch()) {
        try {
          await consumer(item);
        } catch (e) {
          util.debug('Error while invoke items consumer: %o', e);
        }
      }
    }
    getProgres() {
      return { page: this.pageProgress, item: this.itemProgress };
    }
  }

  class ProfileFeedListFetcher extends ListFetcher {
    constructor(conf) {
      super(conf);
      this.pids = this.url.searchParams.get('pids');
      this.domParser = new DOMParser();
    }
    initialPage() {
      const dom = this.current.dom;
      this.current.config = parse.config(dom);
      for (let model of parse.models(dom)) {
        try {
          if (!model || !model.html) continue;
          const dom = this.domParser.parseFromString(model.html, 'text/html');
          if (!dom.querySelector('.WB_feed .WB_feed_type[mid]')) continue;
          this.current.last = this.current.first = dom;
        } catch (e) { /* ignore */ }
      }
      this.current.pagebar = 0;
    }
    getItemsOnPage() {
      const first = this.current.first;
      if (!first) return [];
      return Array.from(first.querySelectorAll('.WB_feed_type[mid]'));
    }
    getLazyLoadItems() {
      const fetcher = this;
      const last = fetcher.current.last;
      if (!last) return null;
      const lazyload = last.querySelector('[node-type="lazyload"]');
      if (!lazyload) return null;
      const params = new URLSearchParams(fetcher.url.searchParams);
      if (fetcher.current.params) {
        fetcher.current.params.forEach((value, name) => { params.set(name, value); });
      }
      params.set('pagebar', fetcher.current.pagebar++);
      params.set('pl_name', fetcher.pids);
      params.set('id', fetcher.current.config.page_id);
      params.set('script_uri', fetcher.url.pathname);
      const feedlist = last.querySelector('.WB_feed');
      if (feedlist) {
        params.set('feed_type', feedlist.getAttribute('feed-type') || 0);
      }
      if (!params.has('page')) params.set('page', 1);
      if (!params.has('pre_page')) params.set('pre_page', params.get('page'));
      const lazyloadData = new URLSearchParams(lazyload.getAttribute('action-data') || '');
      lazyloadData.forEach((value, name) => { params.set(name, value); });
      params.set('domain_op', fetcher.current.config.domain || '');
      fetcher.current.params = params;
      const url = new URL(`https://weibo.com/p/aj/v6/mblog/mbloglist?ajwvr=6`);
      url.searchParams.set('domain', fetcher.current.config.domain);
      params.forEach((value, name) => { url.searchParams.set(name, value); });
      url.searchParams.set('__rnd', new Date().valueOf());
      return (async function () {
        await new Promise(resolve => setTimeout(resolve, fetcher.delay));
        const resp = await fetch(url.href, { credentials: 'same-origin' }).then(resp => resp.text());
        const snippet = JSON.parse(resp).data;
        const dom = fetcher.domParser.parseFromString(snippet, 'text/html');
        fetcher.current.last = dom;
        return Array.from(dom.querySelectorAll('.WB_feed_type[mid]'));
      }());
    }
  }

  request.ProfileFeedListFetcher = ProfileFeedListFetcher;

}());

; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const request = yawf.request = yawf.request || {};

  /**
   * @external
   * @typedef {Object} WeiboConfig
   * @property {string} uid
   */

  /**
   * @external
   * @typedef {Object} parse
   * @property {(dom: HTMLDocument) => WeiboConfig} config
   * @property {(dom: HTMLDocument) => IterableIterator<{ns: string, domid: string, html: string, js: string?, css: string?}>} models
   */

  /**
   * @type {parse}
   */
  const parse = util.parse;

  class Progresser {
    /**
     * @param {number} max
     * @param {number} value
     */
    constructor(max = null, value = null) {
      this.max = max;
      this.value = value;
      /** @type {(( state: { max: number, value: number }) => any)[]} */
      this.listenerList = [];
      this.triggerUpdate();
    }
    clear() {
      this.max = this.value = null;
      this.triggerUpdate();
    }
    /** @param {number} max */
    setMax(max) {
      this.max = max;
      if (!this.value) this.value = 0;
      this.triggerUpdate();
    }
    /** @param {number} value */
    setValue(value) {
      if (value < 0 || value > this.max) return;
      this.value = value;
      this.triggerUpdate();
    }
    incValue() {
      if (this.value === null) return;
      this.setValue(this.value + 1);
    }
    getMax() { return this.max; }
    getValue() { return this.value; }
    /** @param {(state: { max: number, value: number }) => any} listener */
    addUpdateListener(listener) {
      if (this.listenerList.includes(listener)) return;
      this.listenerList.push(listener);
    }
    triggerUpdate() {
      this.listenerList.forEach(listener => {
        try {
          listener({ max: this.max, value: this.value });
        } catch (e) {
          util.debug('Failed to execute Progresser listener: %o', e);
        }
      });
    }
  }

  request.Progresser = Progresser;

  class Log {
    constructor() {
      this.logs = new WeakMap();
      this.callbacks = [];
      this.container = null;
    }
    render(container) {
      this.container = container;
    }
    start(item) {
      this.updateStatus(item, 'processing', { startTime: new Date() });
    }
    finish(item, success) {
      const status = success === null ? 'skip' : success ? 'success' : 'fail';
      this.updateStatus(item, status, { endTime: new Date() });
    }
    started(item) {
      return this.logs.has(item);
    }
    updateStatus(item, status, detail) {
      if (!this.logs.has(item)) {
        this.logs.set(item, {});
      }
      const log = this.logs.get(item);
      const oldStatus = log.oldStatus;
      Object.assign(log, detail, { status });
      this.callbacks.forEach(callback => {
        try {
          callback(item, status, oldStatus, log);
        } catch (e) {
          util.debug('Error while update log status: %o', e);
        }
      });
    }
    onUpdateStatus(callback) {
      this.callbacks.push(callback);
    }
  }

  /**
   * @typedef {Object} Context
   * @property {URL} url
   * @property {string} html
   * @property {HTMLDocument} dom
   * @property {WeiboConfig} config
   */

  /**
   * @class
   * @template ListItem
   */
  class ListFetcher {
    get defaultPageDelay() { return 5000; }
    get defaultItemDelay() { return 1000; }
    /**
     * @param {object} config
     * @param {number} config.first
     * @param {number?} config.last
     * @param {number?} config.pageDelay
     * @param {number?} config.itemDelay
     * @param {boolean} config.isDelete
     * @param {((item: ListItem) => boolean)?} config.filter
     * @param {Context} context
     */
    constructor({ first, last = null, pageDelay, itemDelay, isDelete = false, filter }, context) {
      // 如果是删除用，那么随着删除，页码会跟着变化
      // 所以没办法根据截止的页码来控制删除
      if (isDelete && last !== null) {
        throw new Error('Cannot set last page for deleting.');
      }
      this.context = context;

      this.isDelete = isDelete;

      this.first = Number(first);
      this.last = Number(last) || null;
      /** @type {number} */
      this.total = null;
      this.parsed = 0;

      this.pageDelay = pageDelay || this.defaultPageDelay;
      this.itemDelay = itemDelay || this.defaultItemDelay;

      this.buffer = [];
      this.consumed = false;
      this.pageProgress = new Progresser(this.last);
      this.itemProgress = new Progresser();
      this.log = new Log();

      this.filter = filter;
    }
    /** @param {number} total */
    setTotal(total) {
      this.total = total;
      if (this.isDelete) {
        this.pageProgress.setMax(this.total - this.page + this.processed + 1);
      }
    }
    /** @param {boolean} repeat */
    nextPage(repeat) {
      this.processed++;
      this.page++;
      if (this.isDelete) {
        if (this.peek) {
          this.peek = 0;
          this.page--;
        } else if (repeat) {
          // 如果开启了过滤条件，有可能只删除了少数内容其他内容都被跳过了
          // 这时候如果反复这一页可能每次只删除一条，十分浪费时间
          // 所以我们先把下一页的删一下，再回来删这一页，这样可以尽可能减少反复
          if (!this.isDone()) this.peek = 1;
          this.page--;
        }
        this.pageProgress.setMax(this.total - this.page + this.processed + 1);
        this.pageProgress.setValue(this.processed);
      } else {
        this.pageProgress.incValue();
      }
    }
    /** @returns { boolean} */
    isDone() {
      if (this.isDelete) {
        // 如果是删除，那么我们只关心是不是删除到最后一页了
        return this.total && this.page > this.total;
      } else {
        // 否则我们看是不是已经到了目标的页码
        return this.page > this.last;
      }
    }
    /** @param {number} duration */
    async delay(duration) {
      await new Promise(resolve => setTimeout(resolve, duration));
    }
    /**
     * @param {(item: ListItem) => boolean} callback
     */
    async fetch(callback) {
      this.pageProgress.setValue(0);
      this.page = this.first;
      if (this.isDelete) this.peek = 0;
      this.processed = 0;
      while (!this.isDone()) {
        if (this.processed) {
          await this.delay(this.pageDelay);
        }
        const results = [];
        const page = this.page + this.peek;
        for await (const item of this.getPageItems(this.context, page)) {
          const success = await callback(item);
          results.push(success);
          if (success !== null) {
            await this.delay(this.itemDelay);
          }
        }
        const count = val => results.filter(r => r === val).length;
        util.debug('Page %o finished: %o success, %o fail, %o skip', page, count(true), count(false), count(null));
        this.nextPage(this.isDelete && results.some(s => s));
      }
    }
    /**
     * @param {Context} context
     * @param {number} page
     */
    async fetchPage(context, page) {
      const url = new URL(context.url);
      url.searchParams.set('page', page);
      util.debug('Fetch page %o: %o', page, url.href);
      const html = await fetch(url.href, { credentials: 'same-origin' }).then(resp => resp.text());
      const dom = new DOMParser().parseFromString(html, 'text/html');
      context.html = html;
      context.dom = dom;
    }
    /**
     * 在获取一个页面之后初始化时调用
     * @param {Context} context
     */
    initialPage(context) { throw new Error('unimplementated'); }
    /**
     * 获取加载来的第一页上的东西
     * @param {Context} context
     * @returns {ListItem[]}
     */
    getItemsOnPage(context) { throw new Error('unimplementated'); }
    /**
     * 返回 null 如果已经没有可加载的内容了
     * 返回 Promise<any[]> 如果有东西（至少看起来有东西）可加载
     * @param {Context} context
     * @returns {null|Promise<any[]>}
     */
    getLazyLoadItems(context) {
      return null;
    }
    /**
     * @param {Context} context
     * @param {number} page
     */
    async *getPageItems(context, page) {
      const fetcher = this;
      await fetcher.fetchPage(context, page);
      fetcher.initialPage(context);
      const items = fetcher.getItemsOnPage(context);
      let lazy = null, index = 0;
      // 这里的 async 表示我们一边勤快地处理懒加载
      const lazyLoad = (async function updateLazy() {
        try {
          while (true) {
            fetcher.itemProgress.setMax(items.length);
            lazy = fetcher.getLazyLoadItems(context);
            if (!lazy) break;
            const newItems = await lazy;
            items.push(...newItems);
          }
        } catch (e) {
          lazy = Promise.reject(e);
        }
      }());
      // 如果是删除目的，我们需要等待这一页完全加载完成才可以执行
      if (this.isDelete) await lazyLoad;
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
     * @param {(item: ListItem) => boolean} consumer
     */
    async consume(consumer) {
      this.consumer = consumer;
      if (this.consumed) return;
      this.consumed = true;
      await this.fetch(async item => {
        let success = null;
        try {
          this.log.start(item);
          if (this.filter(item)) {
            success = await consumer(item);
          }
        } catch (e) {
          util.debug('Error while consume item (%o):\n%o', item, e);
          success = false;
        }
        this.log.finish(item, success);
        return success;
      });
    }
    async retry(item) {
      if (!this.consumed) return false;
      if (!this.log.started(item)) return false;
      const consumer = this.consumer;
      this.log.start(item);
      const success = await consumer(item);
      this.log.finish(item, success);
      return success;
    }
    getProgres() {
      return { page: this.pageProgress, item: this.itemProgress };
    }
    getConfig() {
      return this.context.config;
    }
    getLog() {
      return this.log;
    }
  }

  /**
   * @typedef {Object} ProfileContext
   * @property {HTMLDocument} first
   * @property {HTMLDocument} last
   * @property {number} pagebar
   */

  /**
   * @extends {ListFetcher<HTMLElement>}
   */
  class ProfileFeedFetcher extends ListFetcher {
    constructor(conf, context) {
      super({ pageDelay: conf.isDelete ? 100 : 5000, itemDelay: 1000, ...conf }, context);
      this.pids = this.context.url.searchParams.get('pids');
      this.domParser = new DOMParser();
    }
    /** @param {Context & ProfileContext} context */
    updateTotalPage(context) {
      const last = context.last;
      const list = last.querySelector('.WB_feed');
      const pages = (list || last).querySelectorAll('a[bpfilter="page"]');
      if (!pages.length) return;
      const lastPage = Math.max(...[...pages].map(page => Number(new URL(page.href).searchParams.get('page'))));
      this.setTotal(lastPage);
    }
    /** @param {Context & ProfileContext} context */
    initialPage(context) {
      const dom = context.dom;
      context.config = parse.config(dom);
      for (let model of parse.models(dom)) {
        try {
          if (!model || !model.html) continue;
          const dom = this.domParser.parseFromString(model.html, 'text/html');
          if (!dom.querySelector('.WB_feed .WB_feed_type[mid]')) continue;
          context.last = context.first = dom;
          this.updateTotalPage(context);
        } catch (e) { /* ignore */ }
      }
      context.pagebar = 0;
    }
    /** @param {Context & ProfileContext} context */
    getItemsOnPage(context) {
      const first = context.first;
      if (!first) return [];
      const feeds = Array.from(first.querySelectorAll('.WB_feed_type[mid]'));
      feeds.forEach(feed => feed.parentNode.removeChild(feed));
      return feeds;
    }
    /** @param {Context & ProfileContext} context */
    getLazyLoadItems(context) {
      const fetcher = this;
      const last = context.last;
      if (!last) return null;
      const lazyload = last.querySelector('[node-type="lazyload"]');
      if (!lazyload) return null;
      const params = new URLSearchParams(context.url.searchParams);
      if (context.params) {
        context.params.forEach((value, name) => { params.set(name, value); });
      }
      params.set('pagebar', context.pagebar++);
      params.set('pl_name', fetcher.pids);
      params.set('id', context.config.page_id);
      params.set('script_uri', context.url.pathname);
      const feedlist = last.querySelector('.WB_feed');
      if (feedlist) {
        params.set('feed_type', feedlist.getAttribute('feed-type') || 0);
      }
      if (!params.has('page')) params.set('page', 1);
      if (!params.has('pre_page')) params.set('pre_page', params.get('page'));
      const lazyloadData = new URLSearchParams(lazyload.getAttribute('action-data') || '');
      lazyloadData.forEach((value, name) => { params.set(name, value); });
      params.set('domain_op', context.config.domain || '');
      context.params = params;
      const url = new URL(`https://weibo.com/p/aj/v6/mblog/mbloglist?ajwvr=6`);
      url.searchParams.set('domain', context.config.domain);
      params.forEach((value, name) => { url.searchParams.set(name, value); });
      url.searchParams.set('__rnd', new Date().valueOf());
      return ((async () => {
        await this.delay(this.pageDelay);
        const resp = await fetch(url.href, { credentials: 'same-origin' }).then(resp => resp.text());
        const snippet = JSON.parse(resp).data;
        const dom = fetcher.domParser.parseFromString(snippet, 'text/html');
        context.last = dom;
        this.updateTotalPage(context);
        const feeds = Array.from(dom.querySelectorAll('.WB_feed_type[mid]'));
        feeds.forEach(feed => feed.parentNode.removeChild(feed));
        return feeds;
      })());
    }
  }

  request.ProfileFeedFetcher = ProfileFeedFetcher;

  class ProfileFeedDeleter extends ProfileFeedFetcher {
    constructor(conf, context) {
      super({ ...conf, isDelete: true }, context);
    }
  }

  request.ProfileFeedDeleter = ProfileFeedDeleter;


  /**
   * @typedef {Object} CommentOutboxContext
   * @property {HTMLElement} items
   */

  /**
   * @extends {ListFetcher<HTMLElement>}
   */
  class CommentOutboxFetcher extends ListFetcher {
    constructor(conf, context) {
      super({ pageDelay: 1000, itemDelay: 1000, ...conf }, context);
      this.pids = this.context.url.searchParams.get('pids');
      this.domParser = new DOMParser();
    }
    /** @param {Context & CommentOutboxContext} context */
    initialPage(context) {
      const dom = context.dom;
      for (let model of parse.models(dom)) {
        try {
          if (!model || !model.html) continue;
          const dom = this.domParser.parseFromString(model.html, 'text/html');
          const list = dom.querySelector('[node-type="comment_lists"]');
          if (!list) continue;
          const items = Array.from(list.querySelectorAll('.WB_feed_type[comment_id]'));
          context.items = items;
          if (this.isDelete) {
            const pages = list.querySelectorAll('a.page[href]');
            const lastPage = Math.max(...[...pages].map(page => Number(new URL(page.href).searchParams.get('page'))));
            this.setTotal(lastPage);
          }
          items.forEach(item => item.parentNode.removeChild(item));
          break;
        } catch (e) { /* ignore */ }
      }
    }
    /** @param {Context & CommentOutboxContext} context */
    getItemsOnPage(context) {
      return context.items;
    }
  }

  class CommentOutboxDeleter extends CommentOutboxFetcher {
    constructor(conf, context) {
      super({ ...conf, isDelete: true }, context);
    }
  }

  request.CommentOutboxDeleter = CommentOutboxDeleter;

}());

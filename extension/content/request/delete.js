; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const request = yawf.request = yawf.request || {};
  const feedParser = yawf.feed;

  const parse = util.parse;

  const Progresser = request.Progresser;

  class Deleter {
    constructor({ url, start = 1, pageDelay = 1000, itemDelay = 500 }) {
      this.url = new URL(url);
      this.start = start;
      this.page = start;
      this.pageDelay = pageDelay;
      this.itemDelay = itemDelay;
      this.total = null;
      this.parsed = 0;
      this.initialTotal = this.total;
      this.domParser = new DOMParser();
      this.pageProgress = new Progresser();
      this.itemProgress = new Progresser();
    }
    async delay(duration) {
      await new Promise(resolve => setTimeout(resolve, duration));
    }
    async delete(deleter) {
      while (this.total == null || this.page <= this.total) {
        const items = await this.getPageItems();
        let hasSuccessDelete = false;
        this.pageProgress.setMax(this.total - this.start + 1);
        this.pageProgress.setValue(this.page - this.start);
        this.itemProgress.setMax(items ? items.length : 0);
        this.itemProgress.setValue(0);
        if (items) {
          for (const item of items) {
            const success = await deleter(item);
            await this.delay(this.itemDelay);
            hasSuccessDelete = hasSuccessDelete || success;
            this.itemProgress.incValue();
          }
        }
        if (!hasSuccessDelete) {
          this.page++;
        }
        await this.delay(this.pageDelay);
      }
    }
    async getPageItems() {
      const html = await fetch(this.url.href, { credentials: 'same-origin' }).then(resp => resp.text());
      const page = this.domParser.parseFromString(html, 'text/html');
      this.current = { html, page };
      this.initialPage();
      return this.getItemsOnPage();
    }
    initialPage() {}
    getItemsOnPage() {
      return [];
    }
    getProgres() {
      return { page: this.pageProgress, item: this.itemProgress };
    }
  }

  class CommentOutboxDeleter extends Deleter {
    constructor(conf) {
      super(conf);
      this.pids = this.url.searchParams.get('pids');
      this.domParser = new DOMParser();
    }
    initialPage() {
      const page = this.current.page;
      for (let model of parse.models(page)) {
        try {
          if (!model || !model.html) continue;
          const dom = this.domParser.parseFromString(model.html, 'text/html');
          const list = dom.querySelector('[node-type="comment_lists"]');
          if (!list) continue;
          const items = list.querySelectorAll('.WB_feed_type[comment_id]');
          const pages = list.querySelectorAll('a.page[href]');
          const lastPage = Math.max(...[...pages].map(page => Number(new URL(page.href).searchParams.get('page'))));
          this.total = lastPage;
          this.current.items = items;
          break;
        } catch (e) { /* ignore */ }
      }
    }
    getItemsOnPage() {
      return this.current.items;
    }
  }

  request.CommentOutboxDeleter = CommentOutboxDeleter;

}());

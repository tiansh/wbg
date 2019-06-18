; (async function () {

  const yawf = window.yawf;

  const util = yawf.util;
  const init = yawf.init;

  const observer = yawf.observer;

  class ElementObserver {
    constructor() {
      this.handlers = [];
    }
    add(handler) {
      this.handlers.push(handler);
    }
    remove(handler) {
      while (true) {
        const pos = this.handlers.indexOf(handler);
        if (pos === -1) return;
        this.handlers.splice(pos, 1);
      }
    }
    active(elements) {
      elements.forEach(element => {
        this.handlers.forEach(handler => {
          try {
            handler(element);
          } catch (e) {
            util.debug('Error while invoke handler %o: %o', handler, e);
          }
        });
      });
    }
  }

  observer.feed = new ElementObserver();

  init.onLoad(function () {
    observer.dom.add(function feedFilter() {
      const feeds = Array.from(document.querySelectorAll([
        '[action-type="feed_list_item"]:not([wbg-feed])',
        '[node-type="feed_list"] .WB_feed_type:not([wbg-feed])',
      ].join(',')));
      if (!feeds.length) return;
      feeds.forEach(feed => feed.setAttribute('wbg-feed', ''));
      observer.feed.active(feeds);
    });
  });

}());

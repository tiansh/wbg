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

  const vtab = rule.vtab;

  const feedFilter = yawf.rules.feedFilter = {};
  feedFilter.feedFilter = vtab;

  Object.assign(i18n, {
    feedDownloadFilterGroupTitle: {
      cn: '按条件筛选微博',
    },
  });

  const filter = feedFilter.filter = {};
  filter.filter = rule.Group({
    parent: feedFilter.feedFilter,
    template: () => i18n.feedDownloadFilterGroupTitle,
  });

  Object.assign(i18n, {
    feedFilterByOriginal: {
      cn: '按是否是转发筛选|{{original}}原创微博|{{forward}}转发微博|{{unavailable}}转发且原微博不可用',
    },
  });

  filter.filterOriginal = rule.FilterRule({
    id: 'feed_filter_by_original',
    parent: filter.filter,
    template: () => i18n.feedFilterByOriginal,
    ref: {
      original: { type: 'boolean', initial: true },
      forward: { type: 'boolean', initial: true },
      unavailable: { type: 'boolean', initial: true },
    },
    view: 'feedFilter',
    filter(feed) {
      if (!this.isEnabled()) return true;
      const original = this.ref.original.getConfig();
      const forward = this.ref.forward.getConfig();
      const unavailable = this.ref.unavailable.getConfig();
      if (![original, forward, unavailable].includes(true)) return true;
      const isForward = feedParser.isForward(feed);
      const isAvailable = feed.querySelector('.WB_media_expand .WB_info .WB_name, .WB_expand .WB_info .W_fb');
      return isForward ? isAvailable ? forward : unavailable : original;
    },
  });

  Object.assign(i18n, {
    feedFilterByMedia: {
      cn: '按包含的媒体内容筛选|{{nomedia}}不包含图片或视频|{{image}}包含图片|{{video}}包含视频',
    },
  });

  filter.filterMedia = rule.FilterRule({
    id: 'feed_filter_by_media',
    parent: filter.filter,
    template: () => i18n.feedFilterByMedia,
    ref: {
      nomedia: { type: 'boolean', initial: true },
      image: { type: 'boolean', initial: true },
      video: { type: 'boolean', initial: true },
    },
    view: 'feedFilter',
    filter(feed) {
      if (!this.isEnabled()) return true;
      const nomedia = this.ref.nomedia.getConfig();
      const image = this.ref.image.getConfig();
      const video = this.ref.video.getConfig();
      if (!nomedia && !image && !video) return true;
      const hasImage = feed.querySelector('.WB_pic img');
      if (hasImage) return image;
      const hasVideo = feed.querySelector('.WB_video');
      if (hasVideo) return video;
      return nomedia;
    },
  });

  Object.assign(i18n, {
    feedFilterByContent: {
      cn: '按内容是否匹配以下任一正则表达式筛选|正则式{{regexen}}',
    },
  });

  filter.filterContent = rule.FilterRule({
    id: 'feed_filter_by_content',
    parent: filter.filter,
    template: () => i18n.feedFilterByContent,
    ref: {
      regexen: { type: 'regexen' },
    },
    view: 'feedFilter',
    filter(feed) {
      if (!this.isEnabled()) return true;
      const regexen = this.ref.regexen.getConfigCompiled();
      if (regexen.length === 0) return true;
      const text = feedParser.text.detail(feed);
      const matchReg = regexen.find(regex => regex.test(text));
      return Boolean(matchReg);
    },
  });

  Object.assign(i18n, {
    feedFilterByDate: {
      cn: '按发布时间筛选|从{{start}}到{{end}}',
    },
  });

  const dateString = function (date) {
    return new Date(Number(date) + 288e5).toISOString().split('T')[0];
  };
  const today = dateString(new Date());

  filter.filterDate = rule.FilterRule({
    id: 'feed_filter_by_date',
    parent: filter.filter,
    template: () => i18n.feedFilterByDate,
    ref: {
      start: {
        type: 'date',
        min: '2009-08-16',
        max: today,
        initial: '2009-08-16',
      },
      end: {
        type: 'date',
        min: '2009-08-16',
        max: today,
        initial: today,
      },
    },
    view: 'feedFilter',
    filter(feed) {
      if (!this.isEnabled()) return true;
      const start = this.ref.start.getConfig();
      const end = this.ref.end.getConfig();
      const date = feedParser.date.date(feed, true)[0];
      if (!date) return false;
      const dateStr = new Date(+date + 288e5).toISOString().split('T')[0];
      if (dateStr <= end && dateStr >= start) return true;
      if (dateStr >= end && dateStr <= start) return true;
      return false;
    },
  });

}());


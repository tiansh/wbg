; (async function () {

  const yawf = window.yawf;
  const init = yawf.init;
  const util = yawf.util;
  const rule = yawf.rule;

  const wbg = window.wbg;
  const batch = wbg.batch;

  const i18n = util.i18n;

  i18n.feedDeleteTabTitle = {
    cn: '微博删除',
    tw: '微博刪除',
    en: 'Feed Delete',
  };

  const feedDelete = yawf.rules.feedDelete = {};
  feedDelete.feedDelete = rule.Tab({
    template: () => i18n.feedDeleteTabTitle,
  });

  i18n.feedDeleteTitle = {
    cn: '微博删除',
  };

  const profile = feedDelete.profile = {};
  profile.profile = rule.Group({
    parent: feedDelete.feedDelete,
    template: () => i18n.feedDeleteTitle,
  });

  Object.assign(i18n, {
    feedDeleteOnProfile: {
      cn: '在个人主页显示批量删除微博按钮',
    },
    feedDelete: {
      cn: '批量删除微博',
    },
  });

  profile.feedDeleteOnProfile = rule.Rule({
    id: 'feed_delete_on_profile',
    version: 1,
    parent: profile.profile,
    template: () => i18n.feedDeleteOnProfile,
    ainit() {
      batch.handler.add({
        type: 'feed',
        name: i18n.feedDelete,
        context(container) {
          if (init.page.$CONFIG.oid !== init.page.$CONFIG.uid) return false;
          return Boolean(container.closest('[id^="Pl_Official_MyProfileFeed__"]'));
        },
        handler(param) {
          batch.feedDelete.showDialog(param);
        },
      });
    },
  });


  i18n.batchFeedDeleteRangeGroupTitle = {
    cn: '删除范围',
  };

  const range = feedDelete.range = {};
  range.range = rule.Group({
    parent: feedDelete.feedDelete,
    template: () => i18n.batchFeedDeleteRangeGroupTitle,
  });

  Object.assign(i18n, {
    batchFeedDeleteRangePage: {
      cn: '删除从第{{first}}页起的所有微博',
    },
  });

  range.pages = rule.Rule({
    id: 'delete_feed_page_range',
    version: 1,
    parent: range.range,
    initial: true,
    template: () => i18n.batchFeedDeleteRangePage,
    view: 'feedDelete',
    always: true,
    ref: {
      first: {
        render() {
          return document.createTextNode(this.current);
        },
      },
    },
  });


}());

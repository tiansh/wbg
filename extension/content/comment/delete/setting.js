; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const wbg = window.wbg;
  const batch = wbg.batch;

  const i18n = util.i18n;

  i18n.commentDeleteTabTitle = {
    cn: '评论删除',
    tw: '評論刪除',
    en: 'Comment Delete',
  };

  const commentDelete = yawf.rules.commentDelete = {};
  commentDelete.commentDelete = rule.Tab({
    template: () => i18n.commentDeleteTabTitle,
  });

  i18n.commentDeleteOutboxTitle = {
    cn: '我发出的',
  };

  const outbox = commentDelete.outbox = {};
  outbox.outbox = rule.Group({
    parent: commentDelete.commentDelete,
    template: () => i18n.commentDeleteOutboxTitle,
  });

  Object.assign(i18n, {
    commentDeleteOnOutbox: {
      cn: '在我发出的微博页面显示批量删除按钮',
    },
    commentDelete: {
      cn: '批量删除评论',
    },
  });

  outbox.commentDeleteOnOutbox = rule.Rule({
    id: 'comment_delete_on_outbox',
    version: 1,
    parent: outbox.outbox,
    template: () => i18n.commentDeleteOnOutbox,
    ainit() {
      batch.handler.add({
        type: 'comment',
        name: i18n.commentDelete,
        context(container) {
          return Boolean(container.closest('[id*="pl_content_postedcomment"i]'));
        },
        handler(param) {
          batch.commentDeleteOutbox.showDialog(param);
        },
      });
    },
  });


  i18n.batchCommentDeleteRangeGroupTitle = {
    cn: '删除范围',
  };

  const range = commentDelete.range = {};
  range.range = rule.Group({
    parent: commentDelete.commentDelete,
    template: () => i18n.batchCommentDeleteRangeGroupTitle,
  });

  Object.assign(i18n, {
    batchCommentDeleteRangePage: {
      cn: '删除从第{{first}}页起的所有评论',
    },
  });

  range.pages = rule.Rule({
    id: 'delete_comment_page_range',
    version: 1,
    parent: range.range,
    initial: true,
    template: () => i18n.batchCommentDeleteRangePage,
    view: 'commentDelete',
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

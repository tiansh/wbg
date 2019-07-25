; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const rules = yawf.rules;
  const request = yawf.request;
  const downloader = yawf.downloader;

  const ui = util.ui;
  const i18n = util.i18n;
  const css = util.css;
  const timestamp = util.timestamp;

  const wbg = window.wbg;
  const batch = wbg.batch;

  const progress = batch.progress;

  const commentDeleteOutbox = batch.commentDeleteOutbox = {};

  Object.assign(i18n, {
    commentDeleteOutboxDialogTitle: {
      cn: '批量评论删除 - 微博冰糕',
    },
    commentDeleteOutboxDialogHeader: {
      cn: '您发出的评论共 {total} 页，您当前正在查看第 {current} 页',
    },
    commentDeleteProgressDialogHeader: {
      cn: '正在删除自己发出的评论，请勿关闭该标签页',
    },
    commentDeleteOutboxFinish: {
      cn: '已删除您发出的评论',
    },
  });

  const deleteComments = async function ({ url, first }) {
    const deleter = new request.CommentOutboxDeleter({ url, start: first });
    const progressDialog = batch.progress.start({
      dialog: {
        title: i18n.commentDeleteOutboxDialogTitle,
        header: i18n.commentDeleteProgressDialogHeader,
      },
      deleter,
    });
    await deleter.delete(async comment => {
      const id = comment.getAttribute('comment_id');
      const success = await request.deleteComment(id, deleter.page);
      util.debug('Batch delete comment: %o [%s]', id, success ? 'success' : 'FAIL');
      return success;
    });
    progressDialog.hide();
    await ui.alert({
      id: 'wbg-comment-delete-success',
      icon: 'succ',
      title: i18n.commentDeleteOutboxDialogTitle,
      text: i18n.commentDeleteOutboxFinish,
    });
    location.reload();
  };

  commentDeleteOutbox.showDialog = function ({ url, current, total }) {
    const commentDeleteOutboxConfigDialog = ui.dialog({
      id: 'wbg-comment-delete-outbox',
      title: i18n.commentDeleteOutboxDialogTitle,
      render(inner) {
        inner.classList.add('wbg-comment-delete-content');
        inner.innerHTML = `
<div class="wbg-comment-delete-header"></div>
<div class="wbg-comment-delete-body"></div>
`;

        const ruleItems = rule.query({
          includeDisabled: true,
          filter: item => item.commentDelete === true,
        });
        const header = inner.querySelector('.wbg-comment-delete-header');
        header.textContent = i18n.commentDeleteOutboxDialogHeader
          .replace('{current}', current).replace('{total}', total);
        const body = inner.querySelector('.wbg-comment-delete-body');

        const pages = rules.commentDelete.range.pages;
        pages.ref.first.current = current;

        rule.render(body, ruleItems);

      },
      button: {
        ok: function () {
          commentDeleteOutboxConfigDialog.hide();
          deleteComments({ url, first: current });
        },
        cancel: function () {
          commentDeleteOutboxConfigDialog.hide();
        },
      },
    });
    commentDeleteOutboxConfigDialog.show();
  };

  css.append(`
.wbg-comment-delete-content { width: 600px; height: 300px; overflow: auto; }
.wbg-comment-delete-header { padding: 20px 20px 0; }
.wbg-comment-delete-body { padding: 10px; }
`);

}());

/**
 * 这个文件的实现有点脏
 * 我们需要解析网页中 script 标签里面的内容
 * 这些内容应该是后台字符串级别拼出来的，所以用正则式把他们解出来应该不会有问题
 * 毕竟你总不想去用 eval 来解决这个问题，目前看来最好的办法就是这样处理了
 * 如果他们后台换了拼的逻辑这恐怕要大改
 */
; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const parse = util.parse = util.parse || {};

  /**
   * @param {Document} page
   * @return {IterableIterator<{ns: string, domid: string, html: string, js: string?, css: string?}>}
   */
  const models = function* models(page) {
    const scripts = Array.from(page.querySelectorAll('script'));
    for (let i = 0, l = scripts.length; i < l; i++) try {
      const script = scripts[i];
      const content = script.textContent.match(/^\s*FM\.view\((\{.*\})\);?\s*$/);
      if (!content) continue;
      const model = JSON.parse(content[1]);
      yield model;
    } catch (e) { /* ignore */ }
  };
  parse.models = models;

  /**
   * @param {Document} page
   * @returns {Object<string, string>}
   */
  const config = function config(page) {
    const scripts = page.querySelectorAll('script');
    const configScript = Array.from(scripts)
      .find(script => script.textContent.trim().startsWith('var $CONFIG ='));
    return Object.assign({}, ...configScript.textContent
      .match(/\$CONFIG\['([^']*)'\]='([^']*)';/g)
      .map(line => {
        const [config, key, _, value] = line.split("'");
        return { [key]: value };
      })
    );
  };
  parse.config = config;

}());

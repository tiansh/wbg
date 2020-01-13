/**
 * ����ļ���ʵ���е���
 * ������Ҫ������ҳ�� script ��ǩ���������
 * ��Щ����Ӧ���Ǻ�̨�ַ�������ƴ�����ģ�����������ʽ�����ǽ����Ӧ�ò���������
 * �Ͼ����ܲ���ȥ�� eval �����������⣬Ŀǰ������õİ취��������������
 * ������Ǻ�̨����ƴ���߼������Ҫ���
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
      }),
    );
  };
  parse.config = config;

}());

; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const about = yawf.rules.about;

  const i18n = util.i18n;
  i18n.aboutScriptGroupTitle = {
    cn: '关于',
    hk: '關於',
    tw: '關於',
    en: 'About',
  };

  const script = about.script = {};
  script.script = rule.Group({
    parent: about.about,
    template: () => i18n.aboutScriptGroupTitle,
  });

  Object.assign(i18n, {
    aboutText: {
      cn: '{{logo}}微博冰糕 (Weibo Batch Genius) {{version}}{{br}}作者{{author}}。{{br}}如果您在使用过程中遇到任何扩展的错误，或对扩展有任何建议，欢迎到 {{issuePage}} 反馈。{{br}}扩展使用 MPL-2.0 协议开放源代码，您可以在 {{github}} 上查阅。欢迎贡献代码。',
      tw: '{{logo}}微博冰糕 (Weibo Batch Genius) {{version}}{{br}}作者{{author}}。{{br}}如果您在使用過程中遇到任何擴充套件的錯誤，或對其有任何建議，歡迎到 {{issuePage}} 回饋。{{br}}擴充套件以 MPL-2.0 協定開放原始碼，您可以在 {{github}} 上查阅。欢迎贡献代码。',
      en: '{{logo}}Weibo Batch Genius {{version}}{{br}}Created by {{author}}. {{br}}You may report errors and give suggestions on {{issuePage}}.{{br}}This extension is released under MPL-2.0 license. You may get its source from {{github}}. Contributions are welcomed.',
    },
    aboutIssueTracker: {
      cn: '问题跟踪器',
      tw: '問題追踪器',
      en: 'issue tracker',
    },
    aboutGithubRepo: {
      cn: 'GitHub 仓库',
      tw: 'GitHub 存放庫',
      en: 'GitHub repository',
    },
  });

  script.text = rule.Text({
    parent: script.script,
    template: () => i18n.aboutText,
    ref: {
      br: {
        render() {
          return document.createElement('br');
        },
      },
      version: {
        render() {
          const version = browser.runtime.getManifest().version;
          return document.createTextNode(version);
        },
      },
      author: {
        render() {
          const link = document.createElement('a');
          link.href = 'https://weibo.com/tsh90';
          link.title = 'tsh90';
          link.textContent = '@tsh90';
          link.setAttribute('usercard', 'id=3921589057');
          return link;
        },
      },
      logo: {
        render() {
          const container = document.createElement('span');
          container.style.cssFloat = 'right';
          const image = new Image(64, 64);
          image.src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTYgMTYiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiI+CiAgPHBhdGggZmlsbD0iI0Q5MkQzQSIgZD0iTTQgNWExIDEgMCAwIDAgMiAwYTIgMiAwIDAgMSA0IDBhMSAxIDAgMCAwIDIgMGE0IDQgMCAwIDAtOCAwTTQgOS4yNWExIDEgMCAwIDAgMiAwYTIgMiAwIDAgMSA0IDBhMSAxIDAgMCAwIDIgMGE0IDQgMCAwIDAtOCAwIi8+CiAgPHBhdGggZmlsbD0iI0U5OEQ0OSIgZD0iTTcgMTQuNTUxMmExLjMzODUgMS4zMzg1IDAgMCAwIDIgMGw1LTMuNTUxMmExIDEgMCAwIDAtMS42MzA2LTEuMTU4MWwtNC4zNjk0IDMuMTAzM2wtNC4zNjk0LTMuMTAzM2ExIDEgMCAwIDAtMS42MzA2IDEuMTU4MWw1IDMuNTUxMnoiLz4KPC9zdmc+Cg==';
          container.appendChild(image);
          return container;
        },
      },
      issuePage: {
        render() {
          const url = 'https://github.com/tiansh/wbg/issues';
          const link = document.createElement('a');
          link.href = url;
          link.textContent = i18n.aboutIssueTracker;
          link.target = '_blank';
          return link;
        },
      },
      github: {
        render() {
          const url = 'https://github.com/tiansh/wbg';
          const link = document.createElement('a');
          link.href = url;
          link.textContent = i18n.aboutGithubRepo;
          link.target = '_blank';
          return link;
        },
      },
    },
  });

}());


; (async function () {

  const yawf = window.yawf;
  const message = yawf.message;

  const downloadByUrl = async function ({ url, filename, tab = null }) {
    const downloadId = await browser.downloads.download({
      url,
      filename,
      conflictAction: 'overwrite',
    });
    return new Promise(resolve => {
      const downloadFinish = async function (error) {
        browser.downloads.onChanged.removeListener(downloadOnChanged);
        if (error) resolve(false);
        try {
          await browser.downloads.erase({ id: downloadId });
          resolve(true);
        } catch (e) {
          resolve(false);
        }
      };
      const stateUpdate = function (state) {
        if (!state || state === 'in_progress') return;
        if (state === 'complete') downloadFinish();
        else downloadFinish(new Error('Download Failed'));
      };
      const downloadOnChanged = function ({ id, state }) {
        if (id !== downloadId) return;
        if (state) stateUpdate(state.current);
      };
      browser.downloads.onChanged.addListener(downloadOnChanged);
      const downloadItemPromise = browser.downloads.search({ id: downloadId });
      downloadItemPromise.then(([downloadItem]) => {
        stateUpdate(downloadItem.state);
      }, error => downloadFinish(new Error(error)));
    });
  };

  /**
   * @param {{ url: string, filename: string }}
   */
  const downloadFile = async function downloadFile({ url, filename }) {
    const sender = this;
    try {
      if (url.startsWith('data:')) {
        const blob = await fetch(url, { credentials: 'omit' }).then(resp => resp.blob());
        const blobUrl = URL.createObjectURL(blob);
        const success = await downloadByUrl({ url: blobUrl, filename });
        URL.revokeObjectURL(blobUrl);
        return success;
      } else {
        const success = await downloadByUrl({ url, filename, tab: sender.tab });
        return success;
      }
    } catch (e) {
      return false;
    }
  };
  message.export(downloadFile);

  /**
   * @param {{ url: string, filename: string }[]}
   */
  const downloadFiles = async function downloadFiles(files) {
    let success = true;
    for (let i = 0, l = files.length; i < l; i++) {
      success = await downloadFile(files[i]) && success;
    }
    return success;
  };
  message.export(downloadFiles);


}());

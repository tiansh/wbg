; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const timestamp = util.timestamp = {};

  /**
   * @param {Date} date
   */
  timestamp.getDate = function (date) {
    if (!date) date = new Date();
    const year = String(date.getFullYear());
    const month = String(new Date().getMonth() + 1).padStart(2, 0);
    const day = String(new Date().getDate()).padStart(2, 0);
    return year + month + day;
  };

  /**
   * @param {Date} date
   */
  timestamp.getTime = function (date) {
    if (!date) date = new Date();
    const hour = String(new Date().getHours()).padStart(2, 0);
    const minute = String(new Date().getMinutes()).padStart(2, 0);
    const second = String(new Date().getSeconds()).padStart(2, 0);
    const milliSecond = String(new Date().getMilliseconds()).padStart(3, 0);
    return hour + minute + second + milliSecond;
  };

  /**
   * @param {Date} date
   */
  timestamp.getDateTime = function (date) {
    if (!date) date = new Date();
    return timestamp.getDate(date) + timestamp.getTime(date);
  };

}());

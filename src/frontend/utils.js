function getURLParam(name) {
  var urlRegExp = new RegExp('[\?&]' + name + '=([^&#]*)'),
      results = urlRegExp.exec(window.location.href);
  if (results) return results[1] || null;
  return null;
}

module.exports = {
  getURLParam: getURLParam
};

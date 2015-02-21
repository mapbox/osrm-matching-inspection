
function geojsonToTrace(geojson) {
  var trace = {
        coordinates: []
      },
      feature;
  if (geojson && geojson.features && geojson.features.length && geojson.features[0].geometry) {
    feature = geojson.features[0];
    trace.coordinates = feature.geometry.coordinates.map(function(d) {return [d[1], d[0]];});
    if (feature.properties && feature.properties.coordTimes) {
      trace.times = feature.properties.coordTimes.map(function(t) {
        var unixMS = new Date(t).valueOf();
        return Math.floor(unixMS/1000.0);
      });
    }
  }
  return trace;
}

function getURLParam(name) {
  var urlRegExp = new RegExp('[\?&]' + name + '=([^&#]*)'),
      results = urlRegExp.exec(window.location.href);
  if (results) return results[1] || null;
  return null;
}

module.exports = {
  geojsonToTrace: geojsonToTrace,
  getURLParam: getURLParam
};

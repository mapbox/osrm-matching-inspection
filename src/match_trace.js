var csv2geojson = require('csv2geojson'),
    togeojson = require('togeojson'),
    fs = require('fs'),
    jsdom = require('jsdom').jsdom;

function geojsonToTrace(geojson) {
  var trace = {
        coordinates: []
      },
      feature;

  if (geojson &&
      geojson.features &&
      geojson.features.length &&
      geojson.features[0].geometry) {
    feature = geojson.features[0];

    trace.coordinates = feature.geometry.coordinates.map(function(d) {return [d[1], d[0]];});
    if (feature.properties &&
        feature.properties.coordTimes) {
      trace.timestamps = feature.properties.coordTimes.map(function(t) { return parseInt(t); });
    }
  }

  return trace;
}

function fileToGeoJSON(file, callback) {
  var content = fs.readFileSync(file, 'utf-8');

  if (/\.gpx$/g.test(file)) {
    callback(null, togeojson.gpx(jsdom(content)));
  } else if (/\.csv$/g.test(file)) {
    csv2geojson.csv2geojson(content, function(error, geojson) {
      callback(error, geojson && csv2geojson.toLine(geojson));
    });
  } else {
    callback(new Error("Unknown file format: " + file));
  }
}

function matchTrace(osrm, file, callback) {
  fileToGeoJSON(file, function onGeojson(err, geojson) {
    if (err) {
      callback(err);
      return;
    }
    var trace = geojsonToTrace(geojson);

    osrm.match(trace, function(err, result) {
      if (err) {
        callback(err, null);
        return;
      }
      // also return original trace
      result.trace = trace;
      callback(null, result);
    });
  });
}

module.exports = matchTrace;

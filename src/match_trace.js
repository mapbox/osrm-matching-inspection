var csv2geojson = require('csv2geojson'),
    togeojson = require('togeojson'),
    fs = require('fs'),
    jsdom = require('jsdom').jsdom,
    turf = require('turf');

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

// reduce sample rate to sane value filter blobs
function filterGeoJSON(geojson) {
  var outputLine = turf.linestring([]),
      outputGeoJSON = turf.featurecollection([]),
      minTimeDiff = 5, // 12 sampels / minute
      minDistance = 10;
  if (geojson &&
      geojson.features &&
      geojson.features.length &&
      geojson.features[0].geometry) {
    var feature = geojson.features[0],
        coords = feature.geometry.coordinates,
        times = feature.properties && feature.properties.coordTimes || null,
        prevCoord,
        prevTime,
        newCoords,
        newTimes = [];

    newCoords = coords.filter(function(coord, i) {
      var p = turf.point(coord),
          takePoint = true;

      if (i !== 0) {
        takePoint = (times[i] - prevTime > minTimeDiff) &&
                    (turf.distance(prevCoord, p)*1000 > minDistance);
      }

      if (takePoint)
      {
        prevCoord = p;
        prevTime = times[i];
        newTimes.push(times[i]);
      }

      return takePoint;
    });

    if (newCoords.length > 1) {
      outputLine.geometry.coordinates = newCoords;
      outputLine.properties = { coordTimes: newTimes };
      outputGeoJSON.features.push(outputLine);
    }
  }

  return outputGeoJSON;
}

function matchTrace(osrm, file, callback) {
  fileToGeoJSON(file, function onGeojson(err, geojson) {
    if (err) {
      callback(err);
      return;
    }
    var trace = geojsonToTrace(filterGeoJSON(geojson));

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

var csv2geojson = require('csv2geojson'),
    togeojson = require('togeojson'),
    moment = require('moment'),
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
  fs.readFile(file, 'utf-8', function(err, content) {
    if (err) {
        callback(err);
        return;
    }

    if (/\.gpx$/g.test(file)) {
      callback(null, togeojson.gpx(jsdom(content)));
    } else if (/\.csv$/g.test(file)) {
      csv2geojson.csv2geojson(content, function(error, geojson) {
        callback(error, geojson && csv2geojson.toLine(geojson));
      });
    } else {
      callback(new Error("Unknown file format: " + file));
    }
  });
}

// reduce sample rate to sane value filter blobs
function filterGeoJSON(geojson) {
  var outputLine = turf.linestring([]),
      outputGeoJSON = turf.featurecollection([]),
      minTimeDiff = 5, // 12 sampels / minute
      minDistance = 20;

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

    if (times && !times[0].match(/^\d+$/)) {
      // check if for special fucked up date format.
      if (times[0].match(/^\d\d\d\d-\d-\d\d/)) {
        times = times.map(function (t) {
            return Math.floor(moment(t, "YYYY-M-DDTHH:mm:ss") / 1000);
        });
      } else {
        times = times.map(function(t) {
            // js returns dates in milliseconds since epoch
            return Math.floor(Date.parse(t.trim()) / 1000);
        });
      }
    // milli-second based timestamp
    } else if (times && Math.log(parseInt(times[0])) > 23) {
      times = times.map(function(t) { return Math.floor(parseInt(t) / 1000); });
    }

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

function matchTrace(osrm, file, options, callback) {
  if (typeof options === 'function' && callback === undefined) {
      callback = options;
  }
  fileToGeoJSON(file, function onGeojson(err, geojson) {
    if (err) {
      callback(err);
      return;
    }
    var trace = geojsonToTrace(filterGeoJSON(geojson));

    if (trace.coordinates.length < 2)
    {
        callback(new Error("Trace should at least contain two points!"));
        return;
    }

    trace.classify = true;

    for (var key in options) {
      trace[key] = options[key];
    }

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

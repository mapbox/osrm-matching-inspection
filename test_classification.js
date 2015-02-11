#!/bin/node

var low = require('lowdb'),
    request = require('request'),
    async = require('async'),
    rs = require('recursive-search'),
    fs = require('fs'),
    jsdom = require('jsdom').jsdom,
    toGeoJSON = require('./js/togeojson.js'),
    DB_NAME = 'traces',
    DB_FILE = 'labels.json',
    OSRM_URL = 'http://127.0.0.1:5000/match?',
    db = low(DB_FILE),
    classNames = ["unknown", "valid", "invalid"],
    classes = {"unknown": 0, "valid": 1, "invalid": 2, "false-valid": 3, "false-invalid": 4};

function geojsonToURL(geojson) {
  if (geojson && geojson.features && geojson.features.length && geojson.features[0].geometry) {
    var locs = geojson.features[0].geometry.coordinates.map(
      function(d) {
        return 'loc=' + d[1].toFixed(10) + ','  +d[0].toFixed(10);
      }
    );

    return OSRM_URL + locs.join('&');
  }
  return [];
}

function getLabeledTraces() {
  var validRecords = db(DB_NAME).where({cls: classes['valid']}).value(),
      invalidRecords = db(DB_NAME).where({cls: classes['invalid']}).value(),
      labeledTraces = validRecords.concat(invalidRecords);

  console.log("Testing " + labeledTraces.length + " labeled traces.");

  return labeledTraces;
}

function matchTrace(trace, callback) {
  var xml = jsdom(fs.readFileSync(trace.file, 'utf8')),
      url = geojsonToURL(toGeoJSON.gpx(xml));

  request(url, function(error, response, body) {
    if (error) {
      callback(error);
      return;
    }

    trace.response = JSON.parse(body);
    callback(null, trace);
  });
}

function classify(matchedTrace) {
  if (matchedTrace.cls === classes['valid']) {
    return matchedTrace.response.confidence <= 0.5 ? classes['false-invalid'] : classes['valid'];
  } else {
    return matchedTrace.response.confidence > 0.5 ? classes['false-valid'] : classes['invalid'];
  }
}

async.map(getLabeledTraces(), matchTrace, function(error, responses) {
  if (error) return;

  var classifiedResponses = responses.map(classify),
      p = classifiedResponses.filter(function(c) { return c === classes['valid']; }).length,
      n = classifiedResponses.filter(function(c) { return c === classes['invalid']; }).length,
      fp = classifiedResponses.filter(function(c) { return c === classes['false-valid']; }).length,
      fn = classifiedResponses.filter(function(c) { return c === classes['false-invalid']; }).length;

  console.log("valid: " + p);
  console.log("invalid: " + n);
  console.log("False-valid: " + fp);
  console.log("False-invalid: " + fn);
  console.log("-> FP-Rate: " + fp / (fp + n));
  console.log("-> FN-Rate: " + fn / (fn + p));
});


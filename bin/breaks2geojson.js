#!/bin/node

var path = require('path'),
    rs = require('recursive-search'),
    fs = require('fs'),
    polyline = require('polyline'),
    matchTrace = require('../src/match_trace.js'),
    async = require('async'),
    OSRM = require('osrm'),
    OSRMClient = require('osrm-client');

if (process.argv.length < 3) {
  console.error("Usage: node traces2geojson.js DATA_DIRECTORY [OSRM_DATA.osrm]");
  console.error("Will print geojson of the matched traces on stdout.");
  process.exit(1);
}

var directory = process.argv[2],
    // TODO fallback to osrm-client if no data is given
    data = process.argv.length > 3 && path.normalize(process.argv[3]) || undefined,
    osrm = data && new OSRM(data) || new OSRMClient('http://127.0.0.1:5000');


function encode_linestring(coordinates, type, file, confidence) {
    var data = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates,
        },
        "properties": {
            "type": type
        },
    };

    if (file) data.properties.file = file;
    if (confidence) data.properties.confidence = confidence;
    return data;
}

function latLngToLngLat(coord) {
    return [coord[1], coord[0]];
}

function lineToGeoJSON(type, line) {
  return encode_linestring(line.map(latLngToLngLat), type);
}

function splitLines(coordinates, timestamps, begin, end, max_dt) {
  var dt = 0,
      polylines = [],
      break_line = [];
  for (var i = begin; i < end; i++) {
    if (i > 0)
      dt = timestamps[i] - timestamps[i-1];
    if (dt > max_dt) {
      if (break_line.length > 1)
        polylines.push(break_line);
      break_line = [];
    }
    break_line.push(coordinates[i]);
  }
  if (break_line.length > 1) {
    polylines.push(break_line);
  }
  return polylines;
}

function getGeoJSON(file, callback) {
  matchTrace(osrm, file, function (err, response) {
    if (err || !response.matchings) {
      console.error("Could not match: " + file);
      callback(null, []);
      return;
    }

    var polylines = [];

    var first_indices = response.matchings[0].indices,
        last_indices = response.matchings[response.matchings.length-1].indices,
        break_lines,
        begin,
        end;

    var lineTransform = lineToGeoJSON.bind(null, "break");

    if (first_indices[0] > 0) {
      begin = 0;
      end = first_indices[0] + 1;
      break_lines = splitLines(response.trace.coordinates, response.trace.timestamps, begin, end, 20);
      polylines = polylines.concat(break_lines.map(lineTransform));
    }
    if (last_indices[last_indices.length - 1] < response.trace.coordinates.length - 1) {
      begin = last_indices[last_indices.length - 1];
      end = response.trace.coordinates.length;
      break_lines = splitLines(response.trace.coordinates, response.trace.timestamps, begin, end, 20);
      polylines = polylines.concat(break_lines.map(lineTransform));
    }
    for (var subIdx = 1; subIdx < response.matchings.length; subIdx++) {
      var prevIndices = response.matchings[subIdx-1].indices,
          currIndices = response.matchings[subIdx].indices;

      begin = prevIndices[prevIndices.length - 1];
      end = currIndices[0] + 1;

      break_lines = splitLines(response.trace.coordinates, response.trace.timestamps, begin, end, 20);
      polylines = polylines.concat(break_lines.map(lineTransform));
    }

    callback(null, polylines);
  });
}

console.error("Loading files...");
var files = rs.recursiveSearchSync(/(.gpx|.csv)$/, directory);

console.error("Getting traces...");
async.mapLimit(files, 5, getGeoJSON, function (err, polyGroup) {
  var polylines = [];
  // flatten
  for (var i = 0; i < polyGroup.length; i++) {
    for (var j = 0; j < polyGroup[i].length; j++) {
      polylines.push(polyGroup[i][j]);
    }
  }
  console.error("Serializing...");
  console.log(JSON.stringify(polylines));
});


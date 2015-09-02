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

function getGeoJSON(file, callback) {
  matchTrace(osrm, file, function (err, response) {
    if (err || !response.matchings) {
      console.error("Could not match: " + file);
      callback(null, []);
      return;
    }

    var polylines = [];

    response.matchings.forEach(function(submatching) {
      var matched_points = polyline.decode(submatching.geometry, 6).map(latLngToLngLat);
      polylines.push(encode_linestring(matched_points, "matching", null, submatching.confidence));

      var subtrace = submatching.indices.map(function(i) {return response.trace.coordinates[i];}).map(latLngToLngLat);
      polylines.push(encode_linestring(subtrace, "trace", null, submatching.confidence));
    });

    callback(null, polylines);
  });
}

console.error("Loading files...");
var files = rs.recursiveSearchSync(/(.gpx|.csv|.geojson)$/, directory).slice(0, 100);
console.error(" -> " + files.length + " files. ");

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


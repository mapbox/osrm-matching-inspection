#!/bin/node

var TRACE_TABLE_NAME = 'traces';
    MATCHING_TABLE_NAME = 'matchings';

var path = require('path'),
    fs = require('fs'),
    async = require('async'),
    low = require('lowdb'),
    OSRM = require('osrm'),
    OSRMClient = require('osrm-client'),
    dbLoader = require('./src/server/db.js'),
    matchTrace = require('./src/match_trace.js'),
    classes = require('./src/server/classes.js');

if (process.argv.length < 3) {
  console.error("Usage: node test_classification.js DATA_DIRECTORY [OSRM_DATA.osrm]");
  console.error("Will create tested_db.js DATA_DIRECTORY");
  process.exit(1);
}

var directory = process.argv[2],
    targetFilename = path.join(directory, 'tested_db.json'),
    // TODO fallback to osrm-client if no data is given
    data = process.argv.length > 3 && path.normalize(process.argv[3]) || undefined,
    osrm = data && new OSRM(data) || new OSRMClient('http://127.0.0.1:5000'),
    db = dbLoader(directory),
    respDB;

if (fs.existsSync(targetFilename)) {
  fs.unlinkSync(targetFilename);
}
respDB = low(targetFilename);

function getLabeledTraces() {
  var traceGroups = db(MATCHING_TABLE_NAME)
                    .filter(function (r) {
                      return r.cls === classes.nameToId['valid'] ||
                             r.cls === classes.nameToId['invalid'];
                     })
                    .groupBy('id')
                    .value(),
      labeledTraces = [],
      trace;

  // construct actual array
  for (var key in traceGroups) {
    trace = db(TRACE_TABLE_NAME).find({id: traceGroups[key][0].id}).value();
    labeledTraces.push([trace.file, traceGroups[key]]);
  }

  console.error("Testing " + labeledTraces.length + " labeled traces.");

  return labeledTraces;
}

function classify(confidence, cls) {
  if (cls === classes.nameToId['valid']) {
    return confidence <= 0.5 ? classes.nameToId['false-invalid'] : classes.nameToId['valid'];
  }

  return confidence > 0.5 ? classes.nameToId['false-valid'] : classes.nameToId['invalid'];
}

function classifyTrace(traceGroup, callback) {
  var submatchings = traceGroup[1];
  matchTrace(osrm, traceGroup[0], function (err, response) {
    if (err)
    {
      console.error(err);
    }

    if (!response || !response.matchings)
    {
      callback(null, []);
      return;
    }

    var p = 0, n = 0, fp = 0, fn = 0;

    submatchings.forEach(function(submatching) {
      var subIdx = submatching.subIdx,
          result = response.matchings[subIdx],
          cls = classify(result.confidence, submatching.cls),
          data = {
            'geometry': result.geometry,
            'matched': result.matched_points,
            'trace': result.indices.map(function(i) {return response.trace[i];}),
            'cls': cls
          };

      p  += cls === classes.nameToId['valid'] && 1 || 0;
      n  += cls === classes.nameToId['invalid'] && 1 || 0;
      fp += cls === classes.nameToId['false-valid'] && 1 || 0;
      fn += cls === classes.nameToId['false-invalid'] && 1 || 0;

      respDB(MATCHING_TABLE_NAME).push(data);
    });


    callback(null, [p, n, fp, fn]);
  });
}

function onMapped(error, responses) {
  if (error) console.error(error);

  var sums = responses.reduce(function(prev, curr) {
    for (var i = 0; i < prev.length; i++) {
        prev[i] += curr[i];
    }
    return prev;
  }, [0, 0, 0, 0]);

  var p = sums[0],
      n = sums[1],
      fp = sums[2],
      fn = sums[3];

  console.error("valid: " + p);
  console.error("invalid: " + n);
  console.error("False-valid: " + fp);
  console.error("False-invalid: " + fn);
  console.error("-> FP-Rate: " + fp / (fp + n));
  console.error("-> FN-Rate: " + fn / (fn + p));
}

console.log("Getting labeled traces...");
var labeledTraces = getLabeledTraces();
async.map(labeledTraces, classifyTrace, onMapped);


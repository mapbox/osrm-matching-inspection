#!/bin/node

var TABLE_NAME = 'traces';

var path = require('path'),
    async = require('async'),
    dbLoader = require('./src/server/db.js'),
    OSRM = require('osrm'),
    OSRMClient = require('osrm-client'),
    matchTrace = require('./src/match_trace.js'),
    classes = require('./src/server/classes.js');

if (process.argv.length < 3) {
  console.error("Usage: node test_classification.js DATA_DIRECTORY [OSRM_DATA.osrm]");
  process.exit(1);
}

var directory = process.argv[2],
    // TODO fallback to osrm-client if no data is given
    data = process.argv.length > 3 && path.normalize(process.argv[3]) || undefined,
    osrm = data && new OSRM(data) || new OSRMClient('http://127.0.0.1:5000'),
    db = dbLoader(directory);

function getLabeledTraces() {
  var validRecords = db(TABLE_NAME).where({cls: classes.nameToId['valid']}).value(),
      invalidRecords = db(TABLE_NAME).where({cls: classes.nameToId['invalid']}).value(),
      labeledTraces = validRecords.concat(invalidRecords);

  console.log("Testing " + labeledTraces.length + " labeled traces.");

  return labeledTraces;
}

function classify(matchedTrace) {
  if (!matchedTrace) return false;

  if (matchedTrace.cls === classes.nameToId['valid']) {
    return matchedTrace.response.confidence <= 0.5 ? classes.nameToId['false-invalid'] : classes.nameToId['valid'];
  } else {
    return matchedTrace.response.confidence > 0.5 ? classes.nameToId['false-valid'] : classes.nameToId['invalid'];
  }
}

async.map(getLabeledTraces(),
function mapTrace(trace, callback) {
  matchTrace(osrm, trace.file, function (err, response) {
    if (err)
    {
      console.log(err);
    }

    trace.response = response;
    callback(null, trace);
  });
},
function onMapped(error, responses) {
  if (error) console.log(error);

  var classifiedResponses = responses.map(classify),
      p = classifiedResponses.filter(function(c) { return c === classes.nameToId['valid']; }).length,
      n = classifiedResponses.filter(function(c) { return c === classes.nameToId['invalid']; }).length,
      fp = classifiedResponses.filter(function(c) { return c === classes.nameToId['false-valid']; }).length,
      fn = classifiedResponses.filter(function(c) { return c === classes.nameToId['false-invalid']; }).length;

  console.log("valid: " + p);
  console.log("invalid: " + n);
  console.log("False-valid: " + fp);
  console.log("False-invalid: " + fn);
  console.log("-> FP-Rate: " + fp / (fp + n));
  console.log("-> FN-Rate: " + fn / (fn + p));
});


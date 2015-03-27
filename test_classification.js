#!/bin/node

var TABLE_NAME = 'traces';

var path = require('path'),
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
    targetFilename = path.join(directory, 'tested_db.json');
    // TODO fallback to osrm-client if no data is given
    data = process.argv.length > 3 && path.normalize(process.argv[3]) || undefined,
    osrm = data && new OSRM(data) || new OSRMClient('http://127.0.0.1:5000'),
    db = dbLoader(directory);

function getLabeledTraces() {
  var validRecords = db(TABLE_NAME).where({cls: classes.nameToId['valid']}).value(),
      invalidRecords = db(TABLE_NAME).where({cls: classes.nameToId['invalid']}).value(),
      labeledTraces = validRecords.concat(invalidRecords);

  console.error("Testing " + labeledTraces.length + " labeled traces.");

  return labeledTraces;
}

function classify(confidence, cls) {
  if (cls === classes.nameToId['valid']) {
    return confidence <= 0.5 ? classes.nameToId['false-invalid'] : classes.nameToId['valid'];
  }

  return confidence > 0.5 ? classes.nameToId['false-valid'] : classes.nameToId['invalid'];
}

function classifyTrace(trace, callback) {
  matchTrace(osrm, trace.file, function (err, response) {
    if (err)
    {
      console.error(err);
    }

    var subIdx = trace.subIdx || 0;

    if (response && response.matchings && response.matchings.length > subIdx)
    {
      trace.cls = classify(response.matchings[subIdx].confidence, trace.cls);
    }
    trace.response = response;
    callback(null, trace);
  });
}

function onMapped(error, responses) {
  if (error) console.error(error);

  var classifiedResponses = responses.filter(function(c) { return c !== null; }),
      p  = classifiedResponses.filter(function(t) { return t.cls === classes.nameToId['valid']; }).length,
      n  = classifiedResponses.filter(function(t) { return t.cls === classes.nameToId['invalid']; }).length,
      fp = classifiedResponses.filter(function(t) { return t.cls === classes.nameToId['false-valid']; }).length,
      fn = classifiedResponses.filter(function(t) { return t.cls === classes.nameToId['false-invalid']; }).length,
      respDB = low(targetFilename);

  classifiedResponses.forEach(function(r) { respDB(TABLE_NAME).push(r); });

  console.error("valid: " + p);
  console.error("invalid: " + n);
  console.error("False-valid: " + fp);
  console.error("False-invalid: " + fn);
  console.error("-> FP-Rate: " + fp / (fp + n));
  console.error("-> FN-Rate: " + fn / (fn + p));
}

async.map(getLabeledTraces(), classifyTrace, onMapped);


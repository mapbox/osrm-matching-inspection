#!/bin/node

var MATCHINGS_TABLE_NAME = 'matchings',
    TRACE_TABLE_NAME = 'traces';

var express = require('express'),
    path = require('path'),
    dbLoader = require('../src/server/db.js'),
    dbInterface = require('../src/server/db_interface.js'),
    clsInterface = require('../src/server/classification_interface.js'),
    matchingInterface = require('../src/server/matching_interface.js'),
    OSRM = require('osrm'),
    OSRMClient = require('osrm-client'),
    app = express();

if (process.argv.length < 3) {
  console.error("Usage: node server.js DATA_DIRECTORY [OSRM_DATA.osrm]");
  process.exit(1);
}
var directory = process.argv[2],
    // TODO fallback to osrm-client if no data is given
    data = process.argv.length > 3 && path.normalize(process.argv[3]) || undefined,
    osrm = data && new OSRM(data) || new OSRMClient('http://127.0.0.1:5000'),
    db = dbLoader(directory);


dbInterface(app, db);
clsInterface(app, db);

if (osrm) {
  console.log("Matching: Enabled.");
  matchingInterface(app, db, osrm);
}

app.use(express.static(__dirname));

console.log("Listening on http://127.0.0.1:8337 ...");
app.listen(8337);

process.on('SIGINT', function(err) {
  db.close(function(err) {
    if (err) {
      console.error(err);
    }
    console.log("Exiting...");
    process.exit();
  });
});


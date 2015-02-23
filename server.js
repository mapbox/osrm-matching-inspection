#!/bin/node

var TABLE_NAME = 'traces';

var express = require('express'),
    path = require('path'),
    OSRM = require('osrm'),
    dbLoader = require('./src/server/db.js'),
    dbInterface = require('./src/server/db_interface.js'),
    clsInterface = require('./src/server/classification_interface.js'),
    matchingInterface = require('./src/server/matching_interface.js'),
    app = express();

if (process.argv.length < 3) {
  console.error("Usage: node server.js DATA_DIRECTORY [OSRM_DATA.osrm]");
  process.exit(1);
}
var directory = process.argv[2],
    // TODO fallback to osrm-client if no data is given
    data = process.argv.length > 3 && path.normalize(process.argv[3]) || undefined,
    osrm = data && new OSRM(data) || undefined,
    db = dbLoader(directory);

dbInterface(app, db(TABLE_NAME));
clsInterface(app, db(TABLE_NAME));

if (osrm) {
  console.log("Matching: Enabled.");
  matchingInterface(app, db(TABLE_NAME), osrm);
}

app.use(express.static(__dirname));

console.log("Listening on http://127.0.0.1:8337 ...");
app.listen(8337);

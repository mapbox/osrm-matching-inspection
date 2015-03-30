var sqlite3 = require('sqlite3'),
    rs = require('recursive-search'),
    fs = require('fs'),
    path = require('path'),
    async = require('async'),
    classes = require('./classes.js');

function importDirectory(db, directory, callback) {
  console.error("Importing.");
  console.error("  - finding trace files...");
  var files = rs.recursiveSearchSync(/(.gpx|.csv)$/, directory).map(function(f, i) { return [i, f]; });

  console.error("  - adding " + files.length + " files to database...");

  db.run("CREATE TABLE traces (id INTEGER PRIMARY KEY, file TEXT)");
  db.run("CREATE TABLE matchings (id INTEGER, subIdx INTEGER, cls INTEGER, data TEXT, PRIMARY KEY (id, subIdx))");

  db.run("BEGIN TRANSACTION");
  var traceStatement = db.prepare("INSERT INTO traces(id, file) VALUES (?, ?)");
  files.forEach(function(file) { traceStatement.run(file[0], file[1]); });
  traceStatement.finalize();
  db.run("END TRANSACTION");

  db.run("BEGIN TRANSACTION");
  var matchingStatement = db.prepare("INSERT INTO matchings(id, subIdx, cls) VALUES (?, ?, ?)");
  files.forEach(function(file) { matchingStatement.run(file[0], 0, 0); });
  matchingStatement.finalize();
  db.run("END TRANSACTION");

  console.error("done.");
}

function loadDB(directory) {
  var targetFilename = path.join(directory, 'classification_db.sqlite'),
      db = new sqlite3.Database(targetFilename);

  // run in sequential mode to avoid callback hell
  db.serialize();

  if (!fs.existsSync(targetFilename)) {
    importDirectory(db, directory);
  }

  return db;
}

module.exports = loadDB;

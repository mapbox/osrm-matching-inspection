var low = require('lowdb'),
    rs = require('recursive-search'),
    fs = require('fs'),
    path = require('path'),
    classes = require('./classes.js'),
    TABLE_NAME = 'traces';

function importDirectory(target, directory) {
  console.error("Finding trace files...");
  var files = rs.recursiveSearchSync(/(.gpx|.csv)$/, directory),
      inmemoryDB = low(),
      table = inmemoryDB(TABLE_NAME);

  console.log("Adding " + files.length + " files to database...");
  files.map(function(f, i) {table.push({id: i, file: f, cls: classes.nameToId.unknown});});
  inmemoryDB.saveSync(target);
}

function loadDB(directory) {
  var targetFilename = path.join(directory, 'classification_db.json');

  if (!fs.existsSync(targetFilename)) {
    console.error("Could not find: " + targetFilename + ". Importing...");
    importDirectory(targetFilename, directory);
  }

  return low(targetFilename);
}

module.exports = loadDB;

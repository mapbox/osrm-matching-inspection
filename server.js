#!/bin/node

var DB_NAME = 'traces',
    DB_FILE = 'labels.json';

var express = require('express'),
    low = require('lowdb'),
    rs = require('recursive-search'),
    fs = require('fs'),
    db,
    app = express(),
    classNames = ["unknown", "valid", "invalid"],
    classes = {"unknown": 0, "valid": 1, "invalid": 2};

function importDirectory(directory) {
    if (fs.existsSync(DB_FILE)) {
      console.log("Database already exists! Skipping.");
      return;
    }
    console.log("Finding gpx files...");
    var files = rs.recursiveSearchSync(/.gpx$/, directory),
        inmemoryDB = low(),
        table = inmemoryDB(DB_NAME);
    console.log("Adding to database...");
    files.map(function(f, i) {table.push({id: i, file: f, cls: classes.unknown});});
    inmemoryDB.save(DB_FILE);
}

app.get('/classes', function(req, res) {
    var reply = {
        status: "ok",
        classes: classNames,
      };
  res.send(JSON.stringify(reply));
});

app.get('/traces/:cls', function(req, res) {
  var selectedCls = req.params.cls,
      records = db(DB_NAME).where({cls: classes[selectedCls]}).value(),
      reply = {
        status: "ok",
        files: records.map(function(i) {return i.file;}),
      };
  res.send(JSON.stringify(reply));
});

app.get('/classify/:id/:cls', function(req, res) {
  var id = parseInt(req.params.id),
      clsName = req.params.cls;

  db(DB_NAME)
    .find({file: id})
    .assign({cls: classes[clsName]});

  res.send('{status: "ok"}');
});

if (process.argv.length > 2) {
  var directory = process.argv[2];
  console.log('Importing ' + directory + '...');
  importDirectory(directory);
}

db = low(DB_FILE);

app.use(express.static(__dirname));

console.log("Listening on http://127.0.0.1:8337 ...");
app.listen(8337);

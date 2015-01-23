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
    console.log("Adding " + files.length + " files to database...");
    files.map(function(f, i) {table.push({id: i, file: f, cls: classes.unknown});});
    inmemoryDB.saveSync(DB_FILE);
}

app.get('/classes', function(req, res) {
    var reply = {
        status: "ok",
        classes: classNames,
      };
  res.send(JSON.stringify(reply));
});

function handleTrace(selectedCls, selectedId) {
  var selector = { cls: classes[selectedCls]},
      reply = { status: "ok" },
      records;

  if (selectedId !== undefined) selector.id = selectedId;

  records = db(DB_NAME).where(selector).first(1).value();

  if (records.length > 0) {
    reply.trace = {
      id: records[0].id,
      file: records[0].file
    };
  }

  return JSON.stringify(reply);
}

app.get('/trace/:cls/:id', function(req, res) {
  var selectedCls = req.params.cls,
      selectedId = parseInt(req.params.id);

  res.send(handleTrace(selectedCls, selectedId));
});

app.get('/trace/:cls/:id/next', function(req, res) {
  var selectedCls = req.params.cls,
      selectedId = parseInt(req.params.id),
      // FIXME this is a hack and does not scale
      records = db(DB_NAME).where({cls: classes[selectedCls]}).sortBy('id').value(),
      i;

  for (i = 0; i < records.length; i++) {
    if (records[i].id > selectedId) {
      res.send(handleTrace(selectedCls, records[i].id));
      return;
    }
  }

  res.send(JSON.stringify({status: "ok"}));
});

app.get('/trace/:cls', function(req, res) {
  var selectedCls = req.params.cls;

  res.send(handleTrace(selectedCls));
});

app.get('/classify/:id/:cls', function(req, res) {
  var id = parseInt(req.params.id),
      clsName = req.params.cls;

  console.log(id + " classified as " + clsName);

  db(DB_NAME)
    .find({id: id})
    .assign({cls: classes[clsName]});

  res.send(JSON.stringify({status: "ok"}));
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

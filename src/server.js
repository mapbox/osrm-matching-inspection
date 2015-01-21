#!/bin/node

var express = require('express'),
    low = require('lowdb'),
    rs = require('recursive-search'),
    db = low('labels.json'),
    app = express(),
    files = rs.recursiveSearchSync(/.gpx$/, __dirname + '/../data');

app.get('/list/:cls', function(req, res) {
  var selectedCls = parseInt(req.params.cls),
      records = db('traces').where({cls: selectedCls}).value(),
      reply = {
        status: "ok",
        files: records.map(function(i) {return files[i.id];}),
      };
  res.send(JSON.stringify(reply));
});

app.get('/list', function(req, res) {
  var reply = {
        status: "ok",
        files: files,
      };
  res.send(JSON.stringify(reply));
});

app.get('/classify/:id/:cls', function(req, res) {
  var id = parseInt(req.params.id),
      cls = parseInt(req.params.cls);
  db('traces').push({id: id, cls: cls});

  res.send('{status: "ok"}');
});

app.use(express.static(__dirname));

console.log("Listening on http://127.0.0.1:8337 ...");
app.listen(8337);

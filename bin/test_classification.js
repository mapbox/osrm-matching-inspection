#!/bin/node

var path = require('path'),
    fs = require('fs'),
    lowdb = require('lowdb'),
    async = require('async'),
    OSRM = require('osrm'),
    OSRMClient = require('osrm-client'),
    dbLoader = require('../src/server/db.js'),
    matchTrace = require('../src/match_trace.js'),
    classes = require('../src/server/classes.js');

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
respDB = lowdb(targetFilename);

function getLabeledTraces(callback) {

  db.all("SELECT traces.id AS id, " +
         "traces.file AS file, " +
         "matchings.subIdx AS subIdx, " +
         "matchings.cls AS cls " +
         "FROM traces, matchings " +
         "WHERE (cls = 1 OR cls = 2) AND traces.id = matchings.id " +
         "ORDER BY id",
  function(err, rows) {
    if (err) {
      callback(err);
      return;
    }
      if (rows.length < 1) return;
      var labeledTraces = [],
          currentID,
          group;
      for (var i = 0; i < rows.length; i++) {
        currentID = rows[i].id;
        group = [];
        while (i < rows.length && rows[i].id === currentID) {
            group.push({cls: rows[i].cls, subIdx: rows[i].subIdx, id: rows[i].id});
            i++;
        }
        labeledTraces.push([rows[i-1].file, group]);
      }

      console.error("Testing " + labeledTraces.length + " labeled traces.");

      callback(null, labeledTraces);
  });
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
      callback(null, [0, 0, 0, 0]);
      return;
    }

    var p = 0, n = 0, fp = 0, fn = 0;

    submatchings.forEach(function(submatching) {
      if (submatching.subIdx >= response.matchings.length) return;

      var id = submatching.id,
          subIdx = submatching.subIdx,
          result = response.matchings[subIdx],
          cls = classify(result.confidence, submatching.cls),
          data = {
            'geometry': result.geometry,
            'matched': result.matched_points,
            'trace': result.indices.map(function(i) {return response.trace.coordinates[i];}),
            'cls': cls,
            'id': id,
            'subIdx': subIdx
          };

      if (response.debug) {
        var states = response.debug.states,
            chosen_idx;

        chosen_idx = result.indices.map(function(t) {
          var found = false;
          for (var i = 0; i < states[t].length; i++) {
            found = states[t][i].chosen;
            if (found) return [t, i];
          }
        }).filter(function (idx) { return idx !== undefined; });

        data.suspicious = chosen_idx.filter(function(idx) {
          return states[idx[0]][idx[1]].suspicious;
        });

        data.distance_deltas = [];

        var curr_idx, next_idx;
        for (var i = 0; i < chosen_idx.length-1; i++) {
            curr_idx = chosen_idx[i];
            next_idx = chosen_idx[i+1];
            var transition = states[curr_idx[0]][curr_idx[1]].transitions.filter(function(t) {
              return t.to[0] === next_idx[0] && t.to[1] === next_idx[1];
            });
            if (transition.length != 1) {
              console.error("Error: Breakage within a subtrace?!");
            } else {
              data.distance_deltas.push(Math.abs(transition[0].properties[3] - transition[0].properties[4]));
            }
        }
      }

      respDB('matchings').push(data);

      p  += cls === classes.nameToId['valid'] ? 1 : 0;
      n  += cls === classes.nameToId['invalid'] ? 1 : 0;
      fp += cls === classes.nameToId['false-valid'] ? 1 : 0;
      fn += cls === classes.nameToId['false-invalid'] ? 1 : 0;
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

console.error("Getting labeled traces...");
getLabeledTraces( function(err, traces) {
  if (err) {
    console.error(e.msg);
    return;
  }
  async.map(traces, classifyTrace, onMapped);
});


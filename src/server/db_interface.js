var classes = require('./classes.js');

function handleTrace(db, res, selectedCls, selectedId) {
  var reply = { status: "ok" },
      statement;


  function onRows(err, rows) {
    if (err) {
      reply = {status: "error", message: JSON.stringify(err)};
    } else {
      reply.subIndices = rows.map(function(r) { return r.subIdx; });
      reply.id = rows.length > 0 ? rows[0].id : undefined;
    }
    res.send(JSON.stringify(reply));
  }

  if (selectedId !== undefined) {
    statement = db.prepare("SELECT id, subIdx FROM matchings WHERE id = ? AND cls = ?");
    statement.all(selectedId, selectedCls, onRows);
  } else {
    statement = db.prepare("SELECT id, subIdx FROM matchings WHERE cls = ? LIMIT 1");
    statement.all(selectedCls, onRows);
  }
}

module.exports = function(app, db) {
  app.get('/trace/:cls/:id', function(req, res) {
    var selectedCls = classes.nameToId[req.params.cls],
        selectedId = req.params.id !== undefined && parseInt(req.params.id) || undefined;

    if (selectedCls === undefined || (selectedId !== undefined && isNaN(selectedId))) {
      res.send(JSON.stringify({status: "error", message: "Invalid arguments: " + JSON.stringify(req.params)}));
      return;
    }

    handleTrace(db, res, selectedCls, selectedId);
  });

  app.get('/trace/:cls', function(req, res) {
    var selectedCls = classes.nameToId[req.params.cls];

    if (selectedCls === undefined) {
      res.send(JSON.stringify({status: "error", message: "Invalid arguments: " + JSON.stringify(req.params)}));
      return;
    }

    handleTrace(db, res, selectedCls);
  });

  app.get('/trace/:cls/:id/next', function(req, res) {
    var selectedCls = classes.nameToId[req.params.cls],
        selectedId = parseInt(req.params.id);

    if (selectedCls === undefined || isNaN(selectedId)) {
      res.senVd(JSON.stringify({status: "error", message: "Invalid arguments: " + JSON.stringify(req.params)}));
      return;
    }

    var findStatement = db.prepare("SELECT id FROM matchings WHERE id > ? AND cls = ? LIMIT 1");
    findStatement.get(selectedId, selectedCls, function(err, row) {
        if (err) {
          res.send(JSON.stringify({status: "error", message: JSON.stringify(err)}));
          return;
        }

        handleTrace(db, res, selectedCls, row.id);
    });

  });
};

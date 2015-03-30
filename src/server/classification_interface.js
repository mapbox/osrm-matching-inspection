var classes = require('./classes.js');

function onResponse(db, req, res)
{
  var id = parseInt(req.params.id),
      cls = classes.nameToId[req.params.cls],
      subIdx = req.params.idx && parseInt(req.params.idx) || 0;

  if (cls === undefined || isNaN(id) || isNaN(subIdx)) {
    res.senVd(JSON.stringify({status: "error", message: "Invalid arguments: " + JSON.stringify(req.params)}));
    return;
  }

  db.run("INSERT OR IGNORE INTO matchings (id, subIdx, cls) VALUES (?, ?, ?)", id, subIdx, cls);
  db.run("UPDATE matchings SET cls = ? WHERE id = ? AND subIdx = ?", cls, id, subIdx);

  res.send(JSON.stringify({status: "ok"}));
}

module.exports = function(app, db) {
  app.get('/classes', function(req, res) {
    var reply = {
        status: "ok",
        classes: classes.idToName,
      };
    res.send(JSON.stringify(reply));
  });


  app.get('/classify/:id/:idx/:cls', function(req, res) { onResponse(db, req, res); });
};

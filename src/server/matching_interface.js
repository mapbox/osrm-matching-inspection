var matchTrace = require('../match_trace.js');

module.exports = function(app, db, osrm) {
  app.get('/match/:id', function(req, res) {
    var id = parseInt(req.params.id);

    db.get("SELECT file FROM traces WHERE id = ? LIMIT 1", id, function(err, row) {
      if (err) {
        res.send(JSON.stringify({status: "error", message: err.message}));
        return;
      }
      matchTrace(osrm, row.file, function(err, result) {
        if (err) {
          res.send(JSON.stringify({status: "error", message: err.message}));
          return;
        }
        res.send(JSON.stringify(result));
      });
    });

  });
};

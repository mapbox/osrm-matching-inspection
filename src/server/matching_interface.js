var matchTrace = require('../match_trace.js');

module.exports = function(app, table, osrm) {
  app.get('/match/:id', function(req, res) {
    var id = parseInt(req.params.id),
        results = table
                   .where({id: id})
                   .first(1)
                   .value();

    if (results.length < 1) {
      res.send(JSON.stringify({status: "error", message: "Can not find id " + id}));
      return;
    }

    matchTrace(osrm, results[0].file, function(err, result) {
      if (err) {
        res.send(JSON.stringify({status: "error", message: err.message}));
      }
      res.send(JSON.stringify(result));
    });
  });
};

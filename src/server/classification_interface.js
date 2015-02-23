var classes = require('./classes.js');

module.exports = function(app, table) {
  app.get('/classes', function(req, res) {
    var reply = {
        status: "ok",
        classes: classes.idToName,
      };
    res.send(JSON.stringify(reply));
  });

  app.get('/classify/:id/:cls', function(req, res) {
    var id = parseInt(req.params.id),
        clsName = req.params.cls;

    table
      .find({id: id})
      .assign({cls: classes.nameToId[clsName]});

    res.send(JSON.stringify({status: "ok"}));
  });
};

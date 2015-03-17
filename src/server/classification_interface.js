var classes = require('./classes.js');

function onResponse(table, req, res)
{
  console.log(req.params);
  var id = parseInt(req.params.id),
      clsName = req.params.cls,
      subIdx = req.params.idx,
      selector = subIdx && {id: id, subIdx: subIdx} || {id: id};

  table
    .find(selector)
    .assign({cls: classes.nameToId[clsName], subIdx: subIdx || 0});

  res.send(JSON.stringify({status: "ok"}));
}

module.exports = function(app, table) {
  app.get('/classes', function(req, res) {
    var reply = {
        status: "ok",
        classes: classes.idToName,
      };
    res.send(JSON.stringify(reply));
  });


  app.get('/classify/:id/:cls/:idx', function(req, res) { onResponse(table, req, res); });
  app.get('/classify/:id/:cls', function(req, res) { onResponse(table, req, res); });
};

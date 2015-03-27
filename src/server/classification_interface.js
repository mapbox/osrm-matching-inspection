var classes = require('./classes.js');

function onResponse(table, req, res)
{
  var id = parseInt(req.params.id),
      clsName = req.params.cls,
      subIdx = req.params.idx && parseInt(req.params.idx) || 0,
      iter = table.findWhere({id: id, subIdx: subIdx});

  if (iter.value() === undefined){
    table.push({id: id, subIdx: subIdx, cls: classes.nameToId[clsName]});
  } else {
    iter.assign({cls: classes.nameToId[clsName]});
  }

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


  app.get('/classify/:id/:idx/:cls', function(req, res) { onResponse(table, req, res); });
};

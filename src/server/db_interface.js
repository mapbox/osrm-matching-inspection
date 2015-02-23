var classes = require('./classes.js');

function handleTrace(table, selectedCls, selectedId) {
  var selector = { cls: classes.nameToId[selectedCls]},
      reply = { status: "ok" },
      records;

  if (selectedId !== undefined) selector.id = selectedId;

  records = table.where(selector).first(1).value();

  if (records.length > 0) {
    reply.trace = {
      id: records[0].id,
      file: records[0].file
    };
  }

  return JSON.stringify(reply);
}

module.exports = function(app, table) {
  app.get('/trace/:cls/:id', function(req, res) {
    var selectedCls = req.params.cls,
        selectedId = parseInt(req.params.id);

    res.send(handleTrace(table, selectedCls, selectedId));
  });

  app.get('/trace/:cls/:id/next', function(req, res) {
    var selectedCls = req.params.cls,
        selectedId = parseInt(req.params.id),
        // FIXME this is a hack and does not scale
        records = table.where({cls: classes.nameToId[selectedCls]}).sortBy('id').value(),
        i;

    for (i = 0; i < records.length; i++) {
      if (records[i].id > selectedId) {
        res.send(handleTrace(table, selectedCls, records[i].id));
        return;
      }
    }

    res.send(JSON.stringify({status: "ok"}));
  });

  app.get('/trace/:cls', function(req, res) {
    var selectedCls = req.params.cls;

    res.send(handleTrace(table, selectedCls));
  });
};

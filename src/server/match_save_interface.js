var matchTrace = require('../match_trace.js'),
  fs = require('fs');

module.exports = function(app, db, osrm) {
  var bodyParser = require('body-parser'),
      express = require('express'),
      fs = require('fs');
  app.use(bodyParser.json());   
  app.use(bodyParser.urlencoded({    
    extended: true
  })); 

  app.post('/match_save', function(req, res) {
    var total = req.body.total,
        file_match = './data/export_matching.geojson';
    var id = 0, 
    sum = 0,
    subId,
    total = 5;
  
    db.get("SELECT file FROM traces WHERE id = ? LIMIT 1", id, function(err, row) {
      if (err) {
        res.send(JSON.stringify({status: "error"}));
        return;
      }
      for (subId_z =0; subId_z < total_z; subId_z++) {
        matchTrace(subId_z, id, osrm, row.file, function(err, result) {
          if (err) {
            res.send(JSON.stringify({status: "error"}));
            return;
          }
          var feature_start = 
            '{ "type": "Feature", "properties": { "route_id":' + result.route_id +
            ', "route_short_name": "' + result.route_short_name +
            '" , "route_long_name": "' + result.route_long_name +
            '"}, "geometry": { "type": "LineString", "coordinates":';
          sum ++;
  
          result.matchings.forEach( function (matching){
            fs.appendFile(file_match, (feature_start + JSON.stringify(matching.matched_points) + " } }"));
            if (sum ===total_z){
              fs.appendFile(file_match, "\n]\n}");
                res.send({status: "ok", message: "Features saved!"});   
            } else fs.appendFile(file_match, ",\n");
          });
        });
      };
    });
  };
});
}

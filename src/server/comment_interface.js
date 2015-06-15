module.exports = function(app, db) {
  var bodyParser = require('body-parser');
  var express = require('express');
	app.use( bodyParser.json() );  
	app.use(bodyParser.urlencoded({     
  		extended: true
	})); 

app.post('/comment', function(req,res) {
    var file_name = req.body.file_name,
    	confidence = req.body.confidence,
    	comment = req.body.comment,
      route_id = req.body.route_id
   
    db.run("INSERT INTO matchings_comments (file_name, route_id, confidence, comment) VALUES (?,?,?,?)", file_name, route_id, confidence, comment);
    res.send(JSON.stringify("status:ok"));
    return;
    });

  };

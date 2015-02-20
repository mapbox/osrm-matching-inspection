var OSRM = require('osrm-client'),
    trellis = require('./diagram.js'),
    colors = require('./colors.js'),
    utils = require('./utils.js'),
    matchingLayer = utils.debugMatchingLayer(),
    osrm = new OSRM('//127.0.0.1:5000'),
    trace = {},
    history = [];

function geojsonToCoordinates(geojson) {
  if (geojson && geojson.features && geojson.features.length && geojson.features[0].geometry) {
    return geojson.features[0].geometry.coordinates.map(function(d) {return [d[1], d[0]];});
  }
  return [];
}

function onMatched(coordinates, err, response) {
  if (err) return;

  var states = response.debug.states,
      breakage = response.debug.breakage,
      traces = response.traces;

  d3.selectAll("#trellis").remove();

  trellis.buildDiagramm(states, breakage);
  matchingLayer.update(coordinates, states, traces);
  map.fitBounds(matchingLayer.getBounds());
}

function getURLParam(name) {
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (results) return results[1] || null;
  return null;
}

function showMatching(id, next) {
  var url = 'http://127.0.0.1:8337/trace/unknown';
  if (id !== undefined) url += '/' + id;
  if (next !== undefined) url += '/next';

  $.getJSON(url, function(data) {
    trace = data.trace;

    history.push(trace.id);

    window.document.title = "Matching (" + trace.id + "): " + trace.file;

    $.ajax(trace.file).done(function(xml) {
      var geojson = toGeoJSON.gpx(xml),
          coordinates = geojsonToCoordinates(geojson);

      osrm.match(coordinates, onMatched.bind(null, coordinates));
    });
  });
}

function showNextMatching() { if (history.length > 0) showMatching(history[history.length-1], true); }
function showPrevMatching() {
  if (history.length > 1) {
    showMatching(history[history.length-2]);
    history.pop();
    history.pop();
  }
}

L.mapbox.accessToken = 'pk.eyJ1IjoidGhlbWFyZXgiLCJhIjoiSXE4SDlndyJ9.ihcqCB31K7RtzmMDhPzW2g';
var map = L.mapbox.map('map', 'themarex.kel82add'),
    edit = new L.Control.EditInOSM({position: 'topright', widget: 'multiButton', editors: ['id']});

matchingLayer.addTo(map);
edit.addTo(map);

var id = getURLParam('id');
showMatching(parseInt(id) || undefined);

$('body').on('keydown', function(e) {
  if (e.which === 39) showNextMatching();
  if (e.which === 37) showPrevMatching();
});


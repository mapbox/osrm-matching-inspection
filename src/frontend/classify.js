var colors = require('./colors.js'),
    utils = require('./utils.js'),
    layers = require('./layers.js'),
    request = require('browser-request'),
    matchingLayer = layers.matchingLayer();

var trace = {},
    traceLine,
    traceLineOutline,
    matchings = [],
    currentTraceId = -1,
    subTraceIdx = 0;

function onMatched(err, pkg, response) {
  if (err) {
      console.log(err);
      return;
  }

  if (!response.matchings) {
    console.log(response.status);
    return;
  }

  subTraceIdx = 0;

  if (traceLine) map.removeLayer(traceLine);
  if (traceLineOutline) map.removeLayer(traceLineOutline);
  traceLineOutline = L.polyline(response.trace.coordinates, {color: 'black', opacity: 0.3, weight: 7}).addTo(map);
  traceLine = L.polyline(response.trace.coordinates, {color: 'white', opacity: 0.7, weight: 5, lineCap: 'butt', dashArray: [10, 5]}).addTo(map);

  matchings = response.matchings;
  // skip trace
  if (matchings === undefined) showNextMatching();
  matchingLayer.update([matchings[subTraceIdx]]);
  map.fitBounds(matchingLayer.getBounds());
}

function showTrace(traceId) {
  window.document.title = "Classify (" + traceId + " / " + subTraceIdx + ")";
  currentTraceId = traceId;
  request.get({uri: 'http://127.0.0.1:8337/match/' + traceId, json: true}, onMatched);
}

function showNextTrace(id) {
  var url = 'http://127.0.0.1:8337/trace/unknown/' + id + '/next';

  request.get({uri: url, json: true}, function(err, pkg, data) {
    showTrace(data.id);
  });
}

function showNextMatching() {
  if (matchings && subTraceIdx < matchings.length-1)
  {
      subTraceIdx++;
      matchingLayer.update([matchings[subTraceIdx]]);
      window.document.title = "Classify (" + currentTraceId + " / " + subTraceIdx + ")";
  } else {
    showNextTrace(currentTraceId);
  }
}
function showPrevMatching() {
  if (subTraceIdx > 0) {
    subTraceIdx--;
    matchingLayer.update([matchings[subTraceIdx]]);
    window.document.title = "Classify (" + currentTraceId + " / " + subTraceIdx + ")";
  }
}

L.mapbox.accessToken = 'pk.eyJ1IjoidGhlbWFyZXgiLCJhIjoiSXE4SDlndyJ9.ihcqCB31K7RtzmMDhPzW2g';
var map = L.mapbox.map('map', 'themarex.kel82add'),
    edit = new L.Control.EditInOSM({position: 'topright', widget: 'multiButton', editors: ['id']});
    
matchingLayer.addTo(map);
edit.addTo(map);

var param_id = parseInt(utils.getURLParam('id'));
if (param_id === undefined || isNaN(param_id)) {
  // next after -1 => 0
  showNextTrace(currentTraceId);
} else {
  showTrace(param_id);
}

$('body').on('keydown', function(e) {
  if (e.which === 39) { showNextMatching(); return; }
  if (e.which === 37) { showPrevMatching(); return; }

  var clsIdx = e.which - 48;
  if (clsIdx >= 0 && clsIdx < classes.length) classifyCurrentTrace(classes[clsIdx]);
});

function classifyCurrentTrace(cls) {
  var url = 'http://127.0.0.1:8337/classify/' + currentTraceId + '/' + subTraceIdx + '/' + cls;
  request.get({uri: url, json: true}, showNextMatching);
}

request.get({uri: 'http://127.0.0.1:8337/classes', json: true}, function(err, pkg, data) {
  classes = data.classes;

  d3.select('#classes').selectAll('.classify')
    .data(classes).enter()
    .append('div')
    .attr('class', '.classify')
    .append('a')
    .attr('href', '#')
    .html(function(d, i) { return '(' + i + '): ' + d; })
    .on('click', classifyCurrentTrace);

});

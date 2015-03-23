var colors = require('./colors.js'),
    utils = require('./utils.js'),
    layers = require('./layers.js'),
    request = require('browser-request'),
    matchingLayer = layers.matchingLayer();

var trace = {},
    traceLine,
    traceLineOutline,
    matchings = [],
    traceId = 0,
    subTraceIdx = 0;

function onMatched(err, pkg, response) {
  if (err) {
      console.log(err);
      return;
  }

  subTraceIdx = 0;

  if (traceLine) map.removeLayer(traceLine);
  if (traceLineOutline) map.removeLayer(traceLineOutline);
  traceLineOutline = L.polyline(response.trace.coordinates, {color: 'black', opacity: 0.3, weight: 7}).addTo(map);
  traceLine = L.polyline(response.trace.coordinates, {color: 'white', opacity: 0.7, weight: 5, lineCap: 'butt', dashArray: [10, 5]}).addTo(map);

  matchings = response.matchings;
  matchingLayer.update([matchings[subTraceIdx]]);
  map.fitBounds(matchingLayer.getBounds());
}

function showMatching(id, next) {
  var url = 'http://127.0.0.1:8337/trace/invalid';
  if (id !== undefined) url += '/' + id;
  if (next !== undefined) url += '/next';

  request.get({uri: url, json: true}, function(err, pkg, data) {
    trace = data.trace;

    traceId = trace.id;
    window.document.title = "Classify (" + traceId + " / " + subTraceIdx + ")";

    request.get({uri: 'http://127.0.0.1:8337/match/' + trace.id, json: true}, onMatched);
  });
}

function showNextMatching() {
  if (subTraceIdx < matchings.length-1)
  {
      subTraceIdx++;
      matchingLayer.update([matchings[subTraceIdx]]);
      window.document.title = "Classify (" + traceId + " / " + subTraceIdx + ")";
  } else {
    showMatching(traceId, true);
  }
}
function showPrevMatching() {
  if (subTraceIdx > 0) {
    subTraceIdx--;
    matchingLayer.update([matchings[subTraceIdx]]);
    window.document.title = "Classify (" + traceId + " / " + subTraceIdx + ")";
  }
}

L.mapbox.accessToken = 'pk.eyJ1IjoidGhlbWFyZXgiLCJhIjoiSXE4SDlndyJ9.ihcqCB31K7RtzmMDhPzW2g';
var map = L.mapbox.map('map', 'themarex.kel82add');
matchingLayer.addTo(map);

var id = utils.getURLParam('id');
showMatching(parseInt(id) || undefined);

$('body').on('keydown', function(e) {
  if (e.which === 39) showNextMatching();
  if (e.which === 37) showPrevMatching();

  var clsIdx = e.which - 48;
  if (clsIdx >= 0 && clsIdx < classes.length) classifyCurrentTrace(classes[clsIdx]);
});

function classifyCurrentTrace(cls) {
  var url = 'http://127.0.0.1:8337/classify/' + traceId + '/' + cls + '/' + subTraceIdx;
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

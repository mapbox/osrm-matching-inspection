var diagram = require('./diagram.js'),
    colors = require('./colors.js'),
    layers = require('./layers.js'),
    utils = require('./utils.js'),
    matchingLayer = layers.debugMatchingLayer(),
    history = [],
    traceLine,
    total = 0,
    current_subId = 0,
    traceLineOutline = [],
    trellis;

function updateTransitionInfo(p) {
  var probs = d3.select("#probs")
                 .html(function() {
                   return '<b>Previous state probability:</b> ' + p[0] + '<br>' +
                          '<b>Emission probability :</b>' + p[1] + '<br>' +
                          '<b>Transition probability :</b>' + p[2] + '<br>' +
                          '<b>Total :</b>' + (p[0] + p[1] + p[2]) + '<br>' +
                          '<b>Network distance :</b>' + p[3] + '<br>' +
                          '<b>Euclid distance :</b>' + p[4] + '<br>';
                  });
}

function onMatched(response) {
  var states = response.debug.states,
      breakage = response.debug.breakage,
      matchings = response.matchings,
      trace = response.trace;

  if (traceLine) map.removeLayer(traceLine);
  if (traceLineOutline) map.removeLayer(traceLineOutline);
  d3.selectAll("#trellis").remove();
  current_subId = response.subId;
  total = response.total;
  
  traceLineOutline = L.polyline(response.trace.coordinates, {color: 'black', opacity: 0.3, weight: 7}).addTo(map);
  traceLine = L.polyline(response.trace.coordinates, {color: 'white', opacity: 0.7, weight: 5, lineCap: 'butt', dashArray: [10, 5]}).addTo(map);
  trellis = diagram.trellis(d3.select("#info"), matchingLayer, states, breakage);
  trellis.on('transitionselected', updateTransitionInfo);
  matchingLayer.update(trace.coordinates, states, matchings);
  map.fitBounds(matchingLayer.getBounds());
}

function showMatching(id, next) {
  var url = 'http://127.0.0.1:8337/trace/unknown';
  if ((total - current_subId) > 1) id--, current_subId++;

  if (id !== undefined) url += '/' + id;
  if (next !== undefined) url += '/next';

  $.getJSON(url, function(data) {
    var id = data.id;
    if (id === undefined) return;
    history.push(id);
    window.document.title = "Matching " + id;

    $.getJSON('http://127.0.0.1:8337/match/' + id + '/' + current_subId, onMatched);
  });
}

function showNextMatching() { 
    if (history.length > 0) showMatching(history[history.length-1], true); 
}
function showPrevMatching() {
  if (current_subId > 0) current_subId = current_subId - 2;
  else current_subId = -1;
  if (history.length > 1) {
    showMatching(history[history.length-2], true);
    history.pop();
    history.pop();
  }
}

L.mapbox.accessToken = 'pk.eyJ1IjoidGhlbWFyZXgiLCJhIjoiSXE4SDlndyJ9.ihcqCB31K7RtzmMDhPzW2g';
var map = L.mapbox.map('map', 'themarex.kel82add'),
    edit = new L.Control.EditInOSM({position: 'topright', widget: 'multiButton', editors: ['id']});

matchingLayer.addTo(map);
edit.addTo(map);

var id = utils.getURLParam('id');
showMatching(parseInt(id) || undefined);

$('body').on('keydown', function(e) {
  if (e.which === 39) showNextMatching();
  if (e.which === 37) showPrevMatching();
});


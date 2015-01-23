var colors = require('./colors.js');

var trace = {},
    traceLine,
    history = [];

function geojsonToCoordinates(geojson) {
  if (geojson && geojson.features && geojson.features.length && geojson.features[0].geometry) {
    return geojson.features[0].geometry.coordinates.map(function(d) {return L.latLng(d[1], d[0]);});
  }
  return [];
}

function routingShim(response, inputWaypoints, callback, context) {

  if (traceLine) map.removeLayer(traceLine);

  var wps = inputWaypoints.map(function(wp) { return wp.latLng; });

  traceLine = L.polyline(wps, {color: 'green', opacityi: 0.5}).addTo(map);

  routeDoneFunc.call(router, response, inputWaypoints, callback, context);
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

    window.document.title = "Classify (" + trace.id + "): " + trace.file;

    $.ajax(trace.file).done(function(xml) {
      var geojson = toGeoJSON.gpx(xml),
          coordinates = geojsonToCoordinates(geojson);

      lrm.setWaypoints(coordinates);
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
    lrm = L.Routing.control({
      position: 'bottomright',
      serviceUrl: '//127.0.0.1:5000/match',
      routeWhileDragging: true,
      createMarker: function(i, wp, n) {
        var marker = L.circleMarker(wp.latLng, {stroke: false,
                                                fill: true,
                                                fillColor: colors.normal[i % colors.normal.length],
                                                radius: 10,
                                                fillOpacity: 0.5,
                                                draggable: true});
        return marker;
      }
    }).addTo(map),
    router = lrm.getRouter(),
    routeDoneFunc = router._routeDone;


router._routeDone = routingShim;


var id = getURLParam('id');
showMatching(parseInt(id) || undefined);

$('body').on('keydown', function(e) {
  if (e.which === 39) showNextMatching();
  if (e.which === 37) showPrevMatching();

  var clsIdx = e.which - 48;
  if (clsIdx >= 0 && clsIdx < classes.length) classifyCurrentTrace(classes[clsIdx]);
});

function classifyCurrentTrace(cls) {
  if (history.length === 0) return;

  var url = 'http://127.0.0.1:8337/classify/' + history[history.length-1] + '/' + cls;
  $.getJSON(url, showNextMatching);
}

$.getJSON('http://127.0.0.1:8337/classes', function(data) {
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

var trellis = require('./diagram.js'),
    candidates = require('./candidates.js'),
    colors = require('./colors.js'),
    gpx_files = $.getJSON('http://127.0.0.1:8337/list');

var current_file_idx = 0;

function geojsonToCoordinates(geojson) {
  if (geojson && geojson.features && geojson.features.length && geojson.features[0].geometry) {
    return geojson.features[0].geometry.coordinates.map(function(d) {return L.latLng(d[1], d[0]);});
  }
  return [];
}

function routingShim(response, inputWaypoints, callback, context) {
  var candidatesList = response.debug.expanded_candidates,
      transitions = response.debug.transitions;
      breakage = response.debug.breakage;
      viterbi = response.debug.viterbi;
      pruned = response.debug.pruned;
      chosenCandidates = response.debug.chosen_candidates;

  d3.selectAll("#trellis").remove();

  trellis.buildDiagramm(candidatesList, transitions, viterbi, breakage, pruned, chosenCandidates);
  candidates.buildCandiateMarkers(map, candidatesList);

  routeDoneFunc.call(router, response, inputWaypoints, callback, context);
}

function getURLParam(name) {
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (results) return results[1] || null;
  return null;
}

function showMatching(i) {
  var file = gpx_files[i];
  window.document.title = "Matching (" + (i+1) + " / " + gpx_files.length + "): " + file;

  $.ajax(file).done(function(xml) {
    var geojson = toGeoJSON.gpx(xml),
        coordinates = geojsonToCoordinates(geojson);

    lrm.setWaypoints(coordinates);
    current_file_idx = i;
  });
}

function showNextMatching() { showMatching(current_file_idx+1); }
function showPrevMatching() { showMatching(current_file_idx-1); }

L.mapbox.accessToken = 'pk.eyJ1IjoidGhlbWFyZXgiLCJhIjoiSXE4SDlndyJ9.ihcqCB31K7RtzmMDhPzW2g';
var map = L.mapbox.map('map', 'themarex.kel82add'),
    lrm = L.Routing.control({
      position: 'bottomright',
      serviceUrl: '//127.0.0.1:5000/match',
      routeWhileDragging: true,
      createMarker: function(i, wp, n) {
        var marker = L.marker(wp.latLng, {
          icon: L.mapbox.marker.icon({
            'marker-color': colors.normal[i % colors.normal.length]
          }),
          draggable: true,
        });
        return marker;
      }
    }).addTo(map),
    edit = new L.Control.EditInOSM({position: 'topright', widget: 'multiButton', editors: ['id']}),
    router = lrm.getRouter(),
    routeDoneFunc = router._routeDone;


edit.addTo(map);
router._routeDone = routingShim;

showMatching(parseInt(getURLParam('n')-1) || 0);

$('body').on('keydown', function(e) {
  if (e.which === 39) showNextMatching();
  if (e.which === 37) showPrevMatching();
});




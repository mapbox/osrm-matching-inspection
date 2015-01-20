var colors = require('./colors.js');

var candidateMarkers = [],
    candidateLayer;

function highlightMarker(idx, persistent) {
  var m = candidateMarkers[idx[0]][idx[1]];

  m.persistent = m.persistent || persistent;

  m.setStyle({radius: 12, fillOpacity: 0.9, stroke: true, weight: 1, color: '#000', opacity: 0.8});
}

function restoreMarker(idx, force) {
  var m = candidateMarkers[idx[0]][idx[1]];

  if (m.persistent && !force) {
    return;
  } else if (force){
    m.persistent = false;
  }

  m.setStyle({radius: 8, fillOpacity: 0.5, stroke: false});
}

function addCandidates(layer, candidates, color) {
  var idx,
      c,
      size = 8,
      m,
      markers = [];

  for (idx = 0; idx < candidates.length; idx++)
  {
    c = L.latLng(candidates[idx]);
    m = L.circleMarker(c, {stroke: false, fill: true, fillColor: color, radius: size, fillOpacity: 0.5});
    layer.addLayer(m);
    markers.push(m);
  }

  return markers;
}

function buildCandiateMarkers(map, list) {
  if (!candidateLayer) candidateLayer = L.featureGroup().addTo(map);
  else candidateLayer.clearLayers();

  if (candidateMarkers.length > 0) candidateMarkers = [];

  var i;
  for (i = 0; i < list.length; i++) {
      markers = addCandidates(candidateLayer, list[i], colors.darkened[i % colors.darkened.length]);
      candidateMarkers.push(markers);
  }
}

module.exports = {
  highlightMarker: highlightMarker,
  restoreMarker: restoreMarker,
  buildCandiateMarkers: buildCandiateMarkers,
};

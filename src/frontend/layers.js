var polyline = require('polyline'),
    colors = require('./colors.js'),
    regenbogen = require('regenbogen');

var MatchingLayer = L.Class.extend({
  options: {
    style: {color: 'blue', weight: 5},
    confidence: {value: 1}
  },

  initialize: function(options) {
    L.Util.setOptions(this, options);
    this._group = L.layerGroup();
    this._gradient = regenbogen(['red', 'yellow', 'green']);
  },

  update: function(subtraces) {
    this._group.clearLayers();

    subtraces.forEach(function (t) {
      var style = this.options.style;
      var confidence = this.options.confidence;
      if (t.confidence !== undefined)
      {
        style.color = this._gradient(t.confidence);
        confidence.value=t.confidence;
      }
      var line = L.polyline(polyline.decode(t.geometry, 6)/*t.matched_points*/, style);
      this._group.addLayer(line);
      // line.enableEdit();
    }.bind(this));

  },

  getBounds: function() {
    var bounds = this._group.getLayers().map(function (l) {
      return l.getBounds();
    });

    return bounds.reduce(function (previous, current) {
      return previous.extend(current.getSouthWest()).extend(current.getNorthEast());
    });
  },

  addTo: function(map) {
    map.addLayer(this);
    return this;
  },

  onAdd: function(map) {
    this._map = map;
    map.addLayer(this._group);
  },

  onRemove: function() {
    this._map.removeLayer(this._group);
    this._map = null;
  }
});

var DebugMatchingLayer = MatchingLayer.extend({
  initialize: function(options) {
    L.Util.setOptions(this, options);
    MatchingLayer.prototype.initialize.call(this, options);
    this._candidateGroups = L.layerGroup();
    this._traceGroup = L.layerGroup();
  },

  update: function(inputCoordinates, states, subtraces) {
    MatchingLayer.prototype.update.call(this, subtraces);

    this._traceGroup.clearLayers();
    subtraces.map(this._addTraceMarkers.bind(this, inputCoordinates));

    this._candidateGroups.clearLayers();
    states.map(function(candidates, i) {
      this._addCandidateMarkers(candidates, colors.darkened[i % colors.darkened.length]);
    }.bind(this));
  },

  highlightCandidate: function(idx, persistent) {
    var m = this._candidateGroups.getLayers()[idx[0]].getLayers()[idx[1]];

    m.persistent = m.persistent || persistent;

    m.setStyle({radius: 14, fillOpacity: 0.9, stroke: true, weight: 1, color: '#000', opacity: 0.8});
  },

  restoreCandidate: function(idx, force) {
    var m = this._candidateGroups.getLayers()[idx[0]].getLayers()[idx[1]];

    if (m.persistent && !force) {
      return;
    } else if (force){
      m.persistent = false;
    }

    m.setStyle({radius: 8, fillOpacity: 0.5, stroke: false});
  },

  _addTraceMarkers: function (inputCoordinates, trace) {
    var group = this._traceGroup;

    trace.indices.map(function (i) {
      var m = L.marker(inputCoordinates[i], {
        icon: L.mapbox.marker.icon({
          'marker-color': colors.normal[i % colors.normal.length]
        }),
        draggable: false,
      });
      group.addLayer(m);
    });
  },

  _addCandidateMarkers: function(candidates, color) {
    var layer = L.layerGroup(),
        style = {stroke: false, fill: true, fillColor: color, radius: 8, fillOpacity: 0.5, className:'candidate_points'};
    candidates.map(function (candidate) {
      layer.addLayer(L.circleMarker(candidate.coordinate, style));
    });
    this._candidateGroups.addLayer(layer);
  },

  onAdd: function(map) {
    MatchingLayer.prototype.onAdd.call(this, map);

    this._map.addLayer(this._traceGroup);
    this._map.addLayer(this._candidateGroups);
  },

  onRemove: function() {
    this._map.removeLayer(this._group);
    this._map = null;
  }
});

module.exports = {
  matchingLayer: function (options) { return new MatchingLayer(options); },
  debugMatchingLayer: function (options) { return new DebugMatchingLayer(options); }
};

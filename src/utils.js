var polyline = require('polyline'),
    colors = require('./colors.js');

var MatchingLayer = L.Class.extend({
  options: {
    style: {color: 'blue', weight: 5}
  },

  initialize: function(options) {
    L.Util.setOptions(this, options);
    this._group = L.layerGroup();
  },

  update: function(subtraces) {
    this._group.clearLayers();

    subtraces.forEach(function (t) {
      var line = L.polyline(polyline.decode(t.geometry, 6), this.options.style);
      this._group.addLayer(line);
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

  update: function(states, subtraces) {
    MatchingLayer.prototype.update.call(this, subtraces);

    subtraces.map(this._addTraceMarkers.bind(this));
    states.map(function(candidates, i) {
      this._addCandidateMarkers(candidates, colors.darkened[i % colors.darkened.length]);
    }.bind(this));
  },

  _addTraceMarkers: function (trace) {
    var group = this._traceGroup;
    group.clearLayers();

    trace.input_points.map(function (latLng, i) {
      var m = L.marker(latLng, {
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
        style = {stroke: false, fill: true, fillColor: color, radius: 8, fillOpacity: 0.5};
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

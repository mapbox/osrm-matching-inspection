var candidates_list = [],
    transitions = [],
    viterbi = [],
    candidate_markers = [],
    selectedNodes = [],
    chosen_candidates = [],
    breakage = [],
    current_file_idx = 0,
    candidateLayer;

function geojsonToCoordinates(geojson) {
  if (geojson && geojson.features && geojson.features.length && geojson.features[0].geometry) {
    return geojson.features[0].geometry.coordinates.map(function(d) {return L.latLng(d[1], d[0]);});
  }
  return [];
}

function trellisLayout(vspace, hspace, nodeSize) {
  return {
    getLabelX: function(i, j) { return (i+0.5)*hspace - nodeSize/2; },
    getLabelY: function(i, j) { return (j+1.5)*vspace + nodeSize/2; },
    getNodeX: function(i, j) { return (i+0.5)*hspace; },
    getNodeY: function(i, j) { return (j+1.5)*vspace; },
    getNodeSize: function(i, j) {return nodeSize;},
    getWidth: function(n) { return (n+0.5)*hspace; },
    getHeight: function(n) { return (n+1.5)*vspace; }
  };
}

// Returns color on grandient that matches to a given f in [0, 1]
function computeColor(f) {
  var start = [255, 255, 255],
      end = [0, 255, 0],
      hex = '#',
      hexVal,
      i;
  for (i = 0; i < 3; i++) {
    hexVal = Math.floor((1-f) * start[i] + f * end[i]).toString(16);
    if (hexVal.length < 2) {
      hexVal = '0' + hexVal;
    }
    hex += hexVal;
  }
  return hex;
}

function highlightNode(idx) {
  function isCompatible(n1, n2) {
    return Math.abs(n1[0]-n2[0]) == 1;
  }

  var svg = d3.select("#trellis"),
      startIdx, endIdx;

  // at most one marker can be compatible
  if (selectedNodes.length > 0) {
    selectedNodes = selectedNodes.filter(function(n) {
      var compat = isCompatible(n, idx);
      if (!compat) restoreMarker(n, true);
      return compat;
    });
  }

  selectedNodes.push(idx);

  startIdx = selectedNodes[0];
  if (selectedNodes.length > 1) {
    endIdx = selectedNodes[1];
    if (startIdx[0] > endIdx[0]) {
      startIdx = selectedNodes[1];
      endIdx = selectedNodes[0];
    }
  }
  if (startIdx) highlightMarker(startIdx, true);
  if (endIdx) highlightMarker(endIdx, true);

  if (startIdx && endIdx) {
    transitionInfo(transitions[endIdx[0]-1][startIdx[1]][endIdx[1]]);
  }

  svg.selectAll(".edge")
    .style("display", function(d) {
      var selected = false;
      if (startIdx) {
        selected = ((d.startIdx[0] === startIdx[0] && d.startIdx[1] === startIdx[1]) ||
                   (d.endIdx[0]    === startIdx[0] && d.endIdx[1]  === startIdx[1]));
      }
      if (endIdx) {
        selected = selected && ((d.startIdx[0] === endIdx[0] && d.startIdx[1] === endIdx[1]) ||
                                (d.endIdx[0]   === endIdx[0] && d.endIdx[1]  === endIdx[1]));
      }

      return selected ? 'inline' : 'none';
    });

  svg.selectAll(".node")
    .style("stroke-width", function(d) {
      if (startIdx && (d.idx[0] === startIdx[0] && d.idx[1] === startIdx[1]) ||
          endIdx   && (d.idx[0] === endIdx[0]   && d.idx[1] === endIdx[1])) {
        return '2px';
      } else {
        return '1px';
      }
    });
}

function highlightMarker(idx, persistent) {
  var m = candidate_markers[idx[0]][idx[1]];

  m.persistent = m.persistent || persistent;

  m.setStyle({radius: 12, fillOpacity: 0.9, stroke: true, weight: 1, color: '#000', opacity: 0.8});
}
function restoreMarker(idx, force) {
  var m = candidate_markers[idx[0]][idx[1]];

  if (m.persistent && !force) {
    return;
  } else if (force){
    m.persistent = false;
  }

  m.setStyle({radius: 8, fillOpacity: 0.5, stroke: false});
}

function transitionInfo(p) {
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

function printDiagramm(lists, transitions, viterbi) {
  var layout = trellisLayout(30, 80, 10),
      width = layout.getWidth(lists.length),
      height = layout.getHeight(Math.max.apply(null, lists.map(function(l) {return l.length; }))),
      info = d3.select("#info"),
      svg = info.append("svg")
      .attr("id", "trellis")
      .attr("width", width)
      .attr("height", height),
      maxViterbi = viterbi.map(function(col) { return Math.max.apply(null, col); }),
      minViterbi = viterbi.map(function(col) { return Math.min.apply(null, col); }),
      nodes = lists.reduce(function(arr, l, i) {
        return arr.concat(l.map(function(v, j) {
          return {
            x: layout.getNodeX(i, j),
            y: layout.getNodeY(i, j),
            idx: [i, j],
            coords: v[0],
            probability: v[1],
            color: pruned[i][j] ? '#ccc' : computeColor((viterbi[i][j] - minViterbi[i]) /  (maxViterbi[i] - minViterbi[i]))
          };
        }));
      }, []),
      edges = transitions.reduce(function(arr, l, i) {
        var results = l.map(function(v, j) {
            var maxWeight = Math.max.apply(null, v.map(function(w) {return w[0]*w[1]*w[2];}));
            return v.map(function(w, k) {
              return {
                x1: layout.getNodeX(i, j),
                y1: layout.getNodeY(i, j),
                x2: layout.getNodeX(i+1, k),
                y2: layout.getNodeY(i+1, k),
                startIdx: [i, j],
                endIdx: [i+1, k],
                stateProb: w[0],
                emissionProb: w[1],
                transitionProb: w[2],
                normalizedWeight:  maxWeight > 0 ? (w[0]*w[1]*w[2]) / maxWeight : 0,
              };
            });
          }),
          // apply trick to flattem results
          merged = [].concat.apply([], results);
        return arr.concat(merged);
      }, []);

  svg.append("g").selectAll('.indicators').data(lists)
      .enter().append("circle")
      .attr("r", layout.getNodeSize())
      .attr("cx", function(d, i) { return layout.getNodeX(i, -1);} )
      .attr("cy", function(d, i) { return layout.getNodeY(i, -1);} )
      .attr("fill", function(d, i) { return color_table[i % color_table.length]; });

  svg.append("g").selectAll('.edge').data(edges)
      .enter().append("line")
      .attr("class", "edge")
      .style("stroke-width", function(d) {return (0.1 + 2*d.normalizedWeight) + 'px'; })
      .attr("x1", function(d) {return d.x1;})
      .attr("y1", function(d) {return d.y1;})
      .attr("x2", function(d) {return d.x2;})
      .attr("y2", function(d) {return d.y2;});
  svg.selectAll('.node').data(nodes)
      .enter().append("g")
      .attr("class", "node")
      .on('mouseenter', function(d) { highlightMarker(d.idx); })
      .on('mouseleave', function(d) { restoreMarker(d.idx); })
      .filter(function(d) { return !breakage[d.idx[0]]; })
      .on('click', function(d) { highlightNode(d.idx); });
  svg.selectAll('.node')
      .filter(function(d) { return breakage[d.idx[0]]; })
      .style('opacity', 0.3);
  svg.selectAll('.node')
      .append("circle")
      .attr("class", "body")
      .attr("r", layout.getNodeSize())
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style("fill", function (d) { return (d.idx[1] == chosen_candidates[d.idx[0]]) ? '#f00' : d.color; });
  svg.selectAll('.node')
      .append("text")
      .attr("class", "label")
      .attr('x', function(d) { return layout.getLabelX.apply(null, d.idx); })
      .attr('y', function(d) { return layout.getLabelY.apply(null, d.idx); })
      .text(function(d) {return d.idx[1]; });
}

var color_table = [
  '#f00',
  '#ff0',
  '#0ff',
  '#0f0',
  '#00f',
];
var darkened_color_table = [
  '#a00',
  '#aa0',
  '#0aa',
  '#0a0',
  '#00a',
];

var info = document.getElementById('info');

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



function routingShim(response, inputWaypoints, callback, context) {
  candidates_list = response.debug.expanded_candidates;
  transitions = response.debug.transitions;
  breakage = response.debug.breakage;
  viterbi = response.debug.viterbi;
  pruned = response.debug.pruned;
  chosen_candidates = response.debug.chosen_candidates;

  d3.selectAll("#trellis").remove();

  printDiagramm(candidates_list, transitions, viterbi);

  if (!candidateLayer) candidateLayer = L.featureGroup().addTo(map);
  else candidateLayer.clearLayers();

  if (candidate_markers.length > 0) candidate_markers = [];

  var i;
  for (i = 0; i < candidates_list.length; i++) {
      markers = addCandidates(candidateLayer, candidates_list[i], darkened_color_table[i % color_table.length]);
      candidate_markers.push(markers);
  }

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
            'marker-color': color_table[i % color_table.length]
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




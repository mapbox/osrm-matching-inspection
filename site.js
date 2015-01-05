L.mapbox.accessToken = 'pk.eyJ1IjoidGhlbWFyZXgiLCJhIjoiSXE4SDlndyJ9.ihcqCB31K7RtzmMDhPzW2g';
var map = L.mapbox.map('map', 'themarex.kel82add');

var test_points = [
L.latLng(52.553759,13.415610),
L.latLng(52.553870,13.414700),
L.latLng(52.554281,13.414820),
];

var candidates_list = [],
    transitions = [],
    viterbi = [],
    candidate_markers = [],
    selectedNodes = [];

function trellisLayout(vspace, hspace, nodeSize) {
  return {
    getLabelX: function(i, j) { return (i+0.5)*hspace - nodeSize/2; },
    getLabelY: function(i, j) { return (j+0.5)*vspace + nodeSize/2; },
    getNodeX: function(i, j) { return (i+0.5)*hspace; },
    getNodeY: function(i, j) { return (j+0.5)*vspace; },
    getNodeSize: function(i, j) {return nodeSize;}
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
                   return '<b>Current state probability:</b> ' + p[0] + '<br>' +
                          '<b>Emission probability :</b>' + p[1] + '<br>' +
                          '<b>Transition probability :</b>' + p[2] + '<br>';
                  });
}

function printDiagramm(lists, transitions, viterbi) {
  var width = 400,
      height = 400,
      layout = trellisLayout(30, 100, 10),
      info = d3.select("#info"),
      probs = info.append("div")
      .attr("id", "probs");
      svg = info.append("svg")
      .attr("id", "trellis")
      .attr("width", width)
      .attr("height", height),
      maxViterbi = viterbi.map(function(col) { return Math.max.apply(null, col); }),
      nodes = lists.reduce(function(arr, l, i) {
        return arr.concat(l.map(function(v, j) {
          return {
            x: layout.getNodeX(i, j),
            y: layout.getNodeY(i, j),
            idx: [i, j],
            coords: v[0],
            probability: v[1],
            color: computeColor(maxViterbi[i] > 0 ? viterbi[i][j] / maxViterbi[i] : 0)
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

  svg.append("g").selectAll('.edge').data(edges)
      .enter().append("line")
      .attr("class", "edge")
      .style("stroke-width", function(d) {return (0.1 + 2*d.normalizedWeight) + 'px'; })
      .attr("x1", function(d) {return d.x1;})
      .attr("y1", function(d) {return d.y1;})
      .attr("x2", function(d) {return d.x2;})
      .attr("y2", function(d) {return d.y2;});
  svg.selectAll('.node').data(nodes)
      .enter().append("g").attr("class", "node")
      .on('click', function(d) { highlightNode(d.idx); })
      .on('mouseenter', function(d) { highlightMarker(d.idx); })
      .on('mouseleave', function(d) { restoreMarker(d.idx); });
  svg.selectAll('.node')
      .append("circle")
      .attr("class", "body")
      .attr("r", layout.getNodeSize())
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style("fill", function (d) { return d.color; });
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
    c = L.latLng(candidates[idx][0]);
    m = L.circleMarker(c, {stroke: false, fill: true, fillColor: color, radius: size, fillOpacity: 0.5});
    layer.addLayer(m);
    markers.push(m);
  }

  return markers;
}

var lrm = L.Routing.control({
      serviceUrl: '//127.0.0.1:5000/match',
      routeWhileDragging: true,
      createMarker: function(i, wp, n) {
        var marker = L.marker(wp.latLng, {
          icon: L.mapbox.marker.icon({
            'marker-color': color_table[i % color_table.length]
          })
        });
        return marker;
      }
    }).addTo(map),
    router = lrm.getRouter(),
    routeDoneFunc = router._routeDone;


function routingShim(response, inputWaypoints, callback, context) {
  candidates_list = response.candidates;
  transitions = response.debug.transitions;
  viterbi = response.debug.viterbi;

  printDiagramm(candidates_list, transitions, viterbi);

  var candidateLayer = L.featureGroup().addTo(map),
      i;
  for (i = 0; i < candidates_list.length; i++) {
      markers = addCandidates(candidateLayer, candidates_list[i], darkened_color_table[i % color_table.length]);
      candidate_markers.push(markers);
  }

  routeDoneFunc.call(router, response, inputWaypoints, callback, context);
}

router._routeDone = routingShim;

lrm.setWaypoints(test_points);



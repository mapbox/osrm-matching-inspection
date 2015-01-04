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
  var start = [255, 0, 0],
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
}

function highlightTransition(idx) {
  var i = idx[0],
      j = idx[1],
      start, end;

  if (i === selectedNode[0]) {
    return;
  }

  start = idx[0] < selectedNode[0] ? idx : selectedNode,
  end   = idx[0] > selectedNode[0] ? idx : selectedNode;
  transitionInfo(transitions[i]);
}

function highlightNode(idx) {
  function isCompatible(n1, n2) {
    return Math.abs(n1[0]-n2[0]) == 1;
  }

  var svg = d3.select("#trellis"),
      startIdx, endIdx;
  if (selectedNodes.length > 0) {
    selectedNodes = selectedNodes.filter(function(n) { return isCompatible(n, idx); });
  }

  selectedNodes.push(idx);
  if (selectedNodes.length > 2) selectedNodes.splice(0, 1);

  startIdx = selectedNodes[0];
  if (selectedNodes.length > 1) {
    endIdx = selectedNodes[1];
    if (startIdx[0] > endIdx[0]) {
      startIdx = selectedNodes[1];
      endIdx = selectedNodes[0];
    }
  }

  svg.selectAll(".edge")
    .style("display", function(d) {
      var selected = ((d.startIdx[0] === startIdx[0] && d.startIdx[1] === startIdx[1]) ||
                      (d.endIdx[0]   === startIdx[0] && d.endIdx[1]  === startIdx[1]));
      if (endIdx) {
        selected = selected && ((d.startIdx[0] === endIdx[0] && d.startIdx[1] === endIdx[1]) ||
                                (d.endIdx[0]   === endIdx[0] && d.endIdx[1]  === endIdx[1]));
      }

      return selected ? 'inline' : 'none';
    });
  svg.selectAll(".node")
    .style("fill", function(d) {
      if ((d.idx[0] === startIdx[0] && d.idx[1] === startIdx[1]) ||
          endIdx && (d.idx[0] === endIdx[0]   && d.idx[1] === endIdx[1])) {
        return '#777';
      } else {
        return computeColor(viterbi[d.idx[0]][d.idx[1]]);
      }
    });
}

function transitionInfo(p) {
  var probs = d3.select("#probs")
                 .html(function() {
                   return '<b>Current state probability:</b> ' + p.stateProb + '<br>' +
                          '<b>Emission probability :</b>' + p.emissionProb + '<br>' +
                          '<b>Transition probability :</b>' + p.transitionProb + '<br>';
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
      nodes = lists.reduce(function(arr, l, i) {
        return arr.concat(l.map(function(v, j) {
          return {
            x: layout.getNodeX(i, j),
            y: layout.getNodeY(i, j),
            idx: [i, j],
            coords: v[0],
            probability: v[1]
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
  svg.selectAll('.edge').data(edges)
      .enter().append("line")
      .attr("class", "edge")
      .style("stroke-width", function(d) {return (0.1 + 2*d.normalizedWeight) + 'px'; })
      .attr("x1", function(d) {return d.x1;})
      .attr("y1", function(d) {return d.y1;})
      .attr("x2", function(d) {return d.x2;})
      .attr("y2", function(d) {return d.y2;});
  svg.selectAll('.node').data(nodes)
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", layout.getNodeSize())
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .on('click', function(d) {highlightNode(d.idx);});
  svg.selectAll('.label').data(nodes)
      .enter().append("text")
      .attr("class", "label")
      .attr('x', function(d) { return layout.getLabelX.apply(null, d.idx); })
      .attr('y', function(d) { return layout.getLabelY.apply(null, d.idx); })
      .text(function(d) {return d.idx[1]; })
      .on('click', function(d) {highlightNode(d.idx);});
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



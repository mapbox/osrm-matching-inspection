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
    selectedNode;

function trellisLayout(vspace, hspace, nodeSize) {
  return {
    getLabelX: function(i, j) { return (i+0.5)*hspace - nodeSize/2; },
    getLabelY: function(i, j) { return (j+0.5)*vspace + nodeSize/2; },
    getNodeX: function(i, j) { return (i+0.5)*hspace; },
    getNodeY: function(i, j) { return (j+0.5)*vspace; },
    getNodeSize: function(i, j) {return nodeSize;}
  };
}

function highlightTransition(idx) {
  if (idx[0] === selectedNode[0]) {
    return;
  }
  var start = idx[0] < selectedNode[0] ? idx : selectedNode,
      end   = idx[0] > selectedNode[0] ? idx : selectedNode;
  transitionInfo(transitions[i])
}
function highlightNode(idx) {
  var svg = d3.select("#trellis");
  selectedNode = idx;
  svg.selectAll(".edge")
    .style("display", function(d) {
      if ((d.startIdx[0] === idx[0] && d.startIdx[1] === idx[1]) ||
          (d.endIdx[0]   === idx[0] &&  d.endIdx[1]  === idx[1])) {
        return 'inline';
      } else {
        return 'none';
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
      .on('click', function(d) {highlightNode(d.idx);})
      .on('mouseover', function(d) {highlightTransition(d.idx);});
  svg.selectAll('.label').data(nodes)
      .enter().append("text")
      .attr("class", "label")
      .attr('x', function(d) { return layout.getLabelX.apply(null, d.idx); })
      .attr('y', function(d) { return layout.getLabelY.apply(null, d.idx); })
      .text(function(d) {return d.idx[1]; })
      .on('click', function(d) {highlightNode(d.idx);})
      .on('mouseover', function(d) {highlightTransition(d.idx);});
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


function showTransitions(e)
{
  var marker = e.target,
      layer = marker.transitionLayer,
      start = L.latLng(marker.origin[0]),
      line,
      end,
      i;

  if (!marker.targets) {
    return;
  }

  layer.clearLayers();
  for (i = 0; i < marker.targets.length; i++) {
    end = L.latLng(marker.targets[i][0]);
    line = L.polyline([start, end], {weight: 2, color: '#000', opacity: 0.5});
    line.transition = marker.transitions[i];
    line.on('mouseover', showInfo);
    line.on('mouseout', function(e) { info.innerHTML = ''; e.target.setStyle({weight: 2}); });
    layer.addLayer(line);
  }
}

function showCandidates(marker, i, color) {
  var candidates = candidates_list[i],
      idx,
      c,
      size,
      m;
  marker.candidateLayer.clearLayers();

  for (idx = 0; idx < candidates.length; idx++)
  {
    c = L.latLng(candidates[idx][0]);
    size = -50/Math.log(viterbi[i][idx] + 0.00001);
    m = L.circleMarker(c, {stroke: false, fill: true, fillColor: color, radius: (2+size), fillOpacity: 0.5});
    m.transitionLayer = L.featureGroup().addTo(map);
    m.origin = candidates_list[i][idx];
    if (i < candidates_list.length-1)
    {
      m.targets = candidates_list[i+1];
      m.transitions = transitions[i][idx];
    }
    m.on('click', showTransitions);
    marker.candidateLayer.addLayer(m);
  }
}

function hover(d, idx) {
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
        marker.on('click', function (e) {
          showCandidates(e.target, i, darkened_color_table[i % color_table.length]);
        });
        marker.candidateLayer = L.featureGroup().addTo(map);
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

  routeDoneFunc.call(router, response, inputWaypoints, callback, context);
}

router._routeDone = routingShim;

lrm.setWaypoints(test_points);



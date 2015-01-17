L.mapbox.accessToken = 'pk.eyJ1IjoidGhlbWFyZXgiLCJhIjoiSXE4SDlndyJ9.ihcqCB31K7RtzmMDhPzW2g';
var map = L.mapbox.map('map', 'themarex.kel82add');

var test_points = [[-104.678430325, 39.8402230768], [-104.678441892, 39.8389490275], [-104.678501319, 39.8384597758], [-104.678864759, 39.8380486854], [-104.679562887, 39.8379289918], [-104.67980898, 39.8379328056], [-104.680118859, 39.8379402655], [-104.680458577, 39.8379774392], [-104.680873565, 39.8379780678], [-104.681298779, 39.8381384556], [-104.682217185, 39.8382390803], [-104.683151851, 39.8379724939], [-104.684411483, 39.8379439535], [-104.685109528, 39.8379617231], [-104.685755354, 39.8379832646], [-104.686448956, 39.8379757209], [-104.687785702, 39.8380496074], [-104.689317746, 39.8380320054], [-104.69090662, 39.8380549299], [-104.691668702, 39.83801784], [-104.692244707, 39.8380088713], [-104.692609236, 39.8379971367], [-104.692684338, 39.8379975977], [-104.692930095, 39.8375566677], [-104.692954905, 39.8370380374], [-104.692967478, 39.8364751507], [-104.692983236, 39.8353401572], [-104.693052471, 39.8349234509], [-104.693834502, 39.8347067368], [-104.694528356, 39.8347132747], [-104.69632485, 39.834510223], [-104.69858679, 39.8343721731], [-104.701106725, 39.8343324429], [-104.703825396, 39.8343223008], [-104.706578516, 39.8343627435], [-104.707955076, 39.8343728017], [-104.710717499, 39.8343978636], [-104.712087102, 39.8343984923], [-104.713447485, 39.8343979055], [-104.714782303, 39.8343917448], [-104.716148051, 39.8344160105], [-104.71753249, 39.8344190698], [-104.718902847, 39.8344359175], [-104.720322322, 39.8344844487], [-104.721726794, 39.8344529746], [-104.723147024, 39.8344437965], [-104.726039535, 39.8344578781], [-104.728824003, 39.8344714148], [-104.730166448, 39.834508379], [-104.731463967, 39.8345035175], [-104.732772382, 39.8345106421], [-104.735264825, 39.8345276993], [-104.73780429, 39.8345596763], [-104.740478452, 39.8345693993], [-104.741831627, 39.8345535156], [-104.743197877, 39.8345594248], [-104.744586507, 39.8345390568], [-104.747482035, 39.8345377995], [-104.748935877, 39.834557497], [-104.751811707, 39.8345945031], [-104.753268734, 39.834595467], [-104.754712852, 39.8345769849], [-104.756173315, 39.8345904379], [-104.757618522, 39.8345968081], [-104.759073285, 39.8345978978], [-104.761973843, 39.8346298328], [-104.763426427, 39.8346442916], [-104.764909437, 39.8346675514], [-104.766377863, 39.8346767715], [-104.767840337, 39.8346412322], [-104.769281438, 39.8345336086], [-104.772149474, 39.8340699636], [-104.773556795, 39.8337102542], [-104.77492162, 39.8332871776], [-104.777473239, 39.8322452233], [-104.778673695, 39.831635356], [-104.779802654, 39.8309582239], [-104.781843396, 39.8294176301], [-104.782791222, 39.8285762547], [-104.783642404, 39.8276586039], [-104.78440172, 39.8266783404], [-104.785120133, 39.825661867], [-104.785725726, 39.824641035], [-104.786607754, 39.8225602694], [-104.786897348, 39.8214528105], [-104.787143776, 39.8203560384], [-104.787271852, 39.8192298878], [-104.787291382, 39.8181088083], [-104.787254585, 39.8159520608], [-104.787251065, 39.8148631677], [-104.787285263, 39.8137720116], [-104.787256345, 39.8115637154], [-104.787240336, 39.8104571365], [-104.787232038, 39.8093764997], [-104.787246287, 39.808266568]]
  .map(function(d) {return L.latLng(d[1], d[0]);});

var candidates_list = [],
    transitions = [],
    viterbi = [],
    candidate_markers = [],
    selectedNodes = [],
    chosen_candidates = [],
    breakage = [],
    candidateLayer;

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

var lrm = L.Routing.control({
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
    router = lrm.getRouter(),
    routeDoneFunc = router._routeDone;


function routingShim(response, inputWaypoints, callback, context) {
  candidates_list = response.debug.expanded_candidates;
  transitions = response.debug.transitions;
  breakage = response.debug.breakage;
  viterbi = response.debug.viterbi;
  pruned = response.debug.pruned;
  chosen_candidates = response.debug.chosen_candidates;
  console.log(chosen_candidates);

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

router._routeDone = routingShim;

lrm.setWaypoints(test_points);



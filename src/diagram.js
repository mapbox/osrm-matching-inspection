var candidates = require('./candidates.js'),
    colors = require('./colors.js');

var selectedNodes = [];

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

function highlightNode(idx, states) {
  function isCompatible(first, second) {
    var index = states[first[0]][first[1]].transitions.findIndex(function(t) {
      return t.to[0] === second[0] && t.to[1] === second[1];
    });
    return index >= 0;
  }
  var svg = d3.select("#trellis"),
      startIdx, endIdx;

  // at most one marker can be compatible
  if (selectedNodes.length > 0) {
    selectedNodes = selectedNodes.filter(function(n) {
      var compat = isCompatible(n, idx);
      if (!compat) candidates.restoreMarker(n, true);
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
  if (startIdx) candidates.highlightMarker(startIdx, true);
  if (endIdx) candidates.highlightMarker(endIdx, true);

  if (startIdx && endIdx) {
    var t = states[startIdx[0]][startIdx[1]].transitions.find(function(d) {
      return d.to[0] === endIdx[0] && d.to[1] === endIdx[1];
    });
    transitionInfo(t.properties);
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

function  buildDiagramm(states, breakage) {
  var layout = trellisLayout(30, 80, 10),
      width = layout.getWidth(states.length),
      height = layout.getHeight(Math.max.apply(null, states.map(function(l) {return l.length; }))),
      info = d3.select("#info"),
      svg = info.append("svg")
      .attr("id", "trellis")
      .attr("width", width)
      .attr("height", height),
      maxViterbi = states.map(function(col) { return Math.max.apply(null, col.map(function(s) { return s.viterbi; })); }),
      minViterbi = states.map(function(col) { return Math.min.apply(null, col.map(function(s) { return s.viterbi; })); }),
      nodes = states.reduce(function(arr, l, i) {
        return arr.concat(l.map(function(s, j) {
          return {
            x: layout.getNodeX(i, j),
            y: layout.getNodeY(i, j),
            idx: [i, j],
            state: s,
            color: s.pruned ? '#ccc' : computeColor((s.viterbi - minViterbi[i]) / (maxViterbi[i] - minViterbi[i]))
          };
        }));
      }, []),
      edges = states.reduce(function(arr, l, i) {
        var results = l.map(function(s, j) {
            return s.transitions.map(function(t, k) {
              return {
                x1: layout.getNodeX(i, j),
                y1: layout.getNodeY(i, j),
                x2: layout.getNodeX(t.to[0], t.to[1]),
                y2: layout.getNodeY(t.to[0], t.to[1]),
                startIdx: [i, j],
                endIdx: [t.to[0], t.to[1]],
              };
            });
          }),
          // apply trick to flattem results
          merged = [].concat.apply([], results);
        return arr.concat(merged);
      }, []);

  svg.append("g").selectAll('.indicators').data(states)
      .enter().append("circle")
      .attr("r", layout.getNodeSize())
      .attr("cx", function(d, i) { return layout.getNodeX(i, -1);} )
      .attr("cy", function(d, i) { return layout.getNodeY(i, -1);} )
      .attr("fill", function(d, i) { return colors.normal[i % colors.normal.length]; });

  svg.append("g").selectAll('.edge').data(edges)
      .enter().append("line")
      .attr("class", "edge")
      .style("stroke-width", "0.5px")
      .attr("x1", function(d) {return d.x1;})
      .attr("y1", function(d) {return d.y1;})
      .attr("x2", function(d) {return d.x2;})
      .attr("y2", function(d) {return d.y2;});
  svg.selectAll('.node').data(nodes)
      .enter().append("g")
      .attr("class", "node")
      .on('mouseenter', function(d) { candidates.highlightMarker(d.idx); })
      .on('mouseleave', function(d) { candidates.restoreMarker(d.idx); })
      .filter(function(d) { return !breakage[d.idx[0]]; })
      .on('click', function(d) { highlightNode(d.idx, states); });
  svg.selectAll('.node')
      .filter(function(d) { return breakage[d.idx[0]]; })
      .style('opacity', 0.3);
  svg.selectAll('.node')
      .append("circle")
      .attr("class", "body")
      .attr("r", layout.getNodeSize())
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style("fill", function (d) { return d.state.chosen ? '#f00' : d.color; });
  svg.selectAll('.node')
      .append("text")
      .attr("class", "label")
      .attr('x', function(d) { return layout.getLabelX.apply(null, d.idx); })
      .attr('y', function(d) { return layout.getLabelY.apply(null, d.idx); })
      .text(function(d) {return d.idx[1]; });
}

module.exports = {
  buildDiagramm: buildDiagramm,
};



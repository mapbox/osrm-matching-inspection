var colors = require('./colors.js'),
    regenbogen = require('regenbogen');

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


var Trellis = L.Class.extend({
  includes: L.Mixin.Events,

  initialize: function (element, layer, states, breakage) {
    this._states = states;
    this._layer = layer;
    this._selectedNodes = [];

    var layout = trellisLayout(30, 80, 10),
        nodes = this._buildNodes(layout, this._states),
        edges = this._buildEdges(layout, this._states);

    this._svg = this._setupSVG(element, this._states, layout);
    this._renderSVG(this._states, breakage, layout, nodes, edges);
  },

  _setupSVG: function(element, states, layout) {
    var width = layout.getWidth(states.length),
        height = layout.getHeight(Math.max.apply(null, states.map(function(l) {return l.length; }))),
        svg = element.append("svg")
        .attr("id", "trellis")
        .attr("width", width)
        .attr("height", height);
    return svg;
  },

  _buildNodes: function(layout, states) {
    var maxViterbi = states.map(function(col) { return Math.max.apply(null, col.map(function(s) { return s.viterbi; })); }),
        minViterbi = states.map(function(col) { return Math.min.apply(null, col.map(function(s) { return s.viterbi; })); }),
        nodes = states.reduce(function(arr, l, i) {
          var gradient = regenbogen(['white', 'lime']);
          return arr.concat(l.map(function(s, j) {
            var normalized_viterbi = (s.viterbi - minViterbi[i]) / (maxViterbi[i] - minViterbi[i]);
            if (isNaN(normalized_viterbi)) normalized_viterbi = 1.0;
            return {
              x: layout.getNodeX(i, j),
              y: layout.getNodeY(i, j),
              idx: [i, j],
              state: s,
              color: s.pruned ? '#ccc' : gradient(normalized_viterbi)
            };
          }));
        }, []);
    return nodes;
  },

  _buildEdges: function(layout, states) {
    var transformed = states.map(function(column, column_idx) {
          return column.map(function(state, row_idx) {
            return state.transitions.map(function(transition) {
              return {
                x1: layout.getNodeX(column_idx, row_idx),
                y1: layout.getNodeY(column_idx, row_idx),
                x2: layout.getNodeX(transition.to[0], transition.to[1]),
                y2: layout.getNodeY(transition.to[0], transition.to[1]),
                startIdx: [column_idx, row_idx],
                endIdx: [transition.to[0], transition.to[1]],
              };
            });
          });
        }),
        edges = transformed.reduce(function(arr, column) {
          // apply trick to flattem results
          var flattened = [].concat.apply([], column);
          return arr.concat(flattened);
        }, []);

    return edges;
  },

  _renderSVG: function(states, breakage, layout, nodes, edges) {
    var svg = this._svg,
        layer = this._layer;

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
        .on('mouseenter', function (d) { layer.highlightCandidate(d.idx, false); })
        .on('mouseleave', function (d) { layer.restoreCandidate(d.idx, false); })
        .filter(function(d) { return !breakage[d.idx[0]]; })
        .on('click', this._onSelectedNode.bind(this));
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
  },


  _onSelectedNode: function(node) {
    var idx = node.idx,
        layer = this._layer,
        states = this._states;

    function nodeIsCompatible(first, second) {
      var index = states[first[0]][first[1]].transitions.findIndex(function(t) {
        return t.to[0] === second[0] && t.to[1] === second[1];
      });
      return index >= 0;
    }

    // at most one marker can be compatible
    if (this._selectedNodes.length > 0) {
      this._selectedNodes = this._selectedNodes.filter(function(n) {
        var compat = nodeIsCompatible(n, idx);
        if (!compat) layer.restoreCandidate(n, true);
        return compat;
      });
    }

    this._selectedNodes.push(idx);

    this._updateSelectedTransition();
  },

  _updateSelectedTransition: function() {
    var svg = this._svg,
        layer = this._layer,
        states = this._states,
        selectedNodes = this._selectedNodes,
        startIdx, endIdx;

    startIdx = selectedNodes[0];
    if (selectedNodes.length > 1) {
      endIdx = selectedNodes[1];
      if (startIdx[0] > endIdx[0]) {
        startIdx = selectedNodes[1];
        endIdx = selectedNodes[0];
      }
    }
    if (startIdx) layer.highlightCandidate(startIdx, true);
    if (endIdx) layer.highlightCandidate(endIdx, true);

    if (startIdx && endIdx) {
      var t = states[startIdx[0]][startIdx[1]].transitions.find(function(d) {
        return d.to[0] === endIdx[0] && d.to[1] === endIdx[1];
      });
      this.fire('transitionselected', t.properties);
    }

    svg.selectAll(".edge")
      .style("stroke-width", function(d) {
        if (startIdx && endIdx) {
          var selected = ((d.startIdx[0] === startIdx[0] && d.startIdx[1] === startIdx[1]) ||
                          (d.endIdx[0]    === startIdx[0] && d.endIdx[1]  === startIdx[1])) &&
                         ((d.startIdx[0] === endIdx[0] && d.startIdx[1] === endIdx[1]) ||
                          (d.endIdx[0]   === endIdx[0] && d.endIdx[1]  === endIdx[1]));
          return selected ? '1px' : '0.3px';

        }

        return '0.5px';
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
  },
});

module.exports = {
  trellis: function (element, layer, states, breakage) { return new Trellis(element, layer, states, breakage); },
};



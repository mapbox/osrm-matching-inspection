L.mapbox.accessToken = 'pk.eyJ1IjoidGhlbWFyZXgiLCJhIjoiSXE4SDlndyJ9.ihcqCB31K7RtzmMDhPzW2g';
var map = L.mapbox.map('map', 'themarex.kel82add');

/*
var test_points = [
L.latLng(52.553759,13.415610),
L.latLng(52.553870,13.414700),
L.latLng(52.554281,13.414820),
];

var test_points = [
L.latLng(52.553759,13.41561),
L.latLng(52.55387,13.4147),
L.latLng(52.55452548398024,13.41506838798523),
L.latLng(52.55525933766414,13.414762616157532)
];
*/

/*
var test_points = [
L.latLng(39.7255868884,-104.974269681),
L.latLng(39.7255837033,-104.973383714),
L.latLng(39.7255990841,-104.971542712),
L.latLng(39.7255907441,-104.970617266),
L.latLng(39.7255904926,-104.969568607),
L.latLng(39.7255835776,-104.968674425),
L.latLng(39.7255900735,-104.967711764),
L.latLng(39.7255752795,-104.966761926),
L.latLng(39.7255805182,-104.965790715),
L.latLng(39.7256237688,-104.961861028),
L.latLng(39.7255787161,-104.960843129),
L.latLng(39.7252809909,-104.959955234),
L.latLng(39.724693629,-104.959463468),
L.latLng(39.7238936602,-104.95944838),
L.latLng(39.7232164443,-104.959457181),
L.latLng(39.7224626597,-104.959452069),
L.latLng(39.7217835579,-104.959445447),
L.latLng(39.7211479582,-104.95944134),
L.latLng(39.7204240971,-104.959445447),
L.latLng(39.719660841,-104.959423905),
L.latLng(39.7189759137,-104.959331704),
L.latLng(39.7184674256,-104.959288705),
];
*/

/*
var test_points = [
L.latLng(39.7338151932,-104.991542436),
L.latLng(39.7338766745,-104.991949545),
L.latLng(39.7338206415,-104.992956212),
L.latLng(39.7339742817,-104.9936473),
L.latLng(39.7347231629,-104.994205786),
L.latLng(39.7357012052,-104.994899053),
L.latLng(39.7366181435,-104.995410265),
L.latLng(39.7368051019,-104.995622411),
L.latLng(39.7373229359,-104.996130439),
L.latLng(39.7381174146,-104.996736031),
L.latLng(39.7388706962,-104.997286471),
L.latLng(39.7396937991,-104.99787488),
L.latLng(39.7401713161,-104.998390367),
L.latLng(39.7401802009,-104.998685159),
L.latLng(39.7402017005,-104.998747269),
L.latLng(39.7402268043,-104.999613538),
L.latLng(39.7402006109,-105.000663372),
L.latLng(39.7402124713,-105.001626369),
L.latLng(39.7401657002,-105.003005946),
L.latLng(39.7401998146,-105.004597837),
L.latLng(39.7402645229,-105.006197607),
L.latLng(39.7403010261,-105.007819338),
L.latLng(39.7403299017,-105.009607868),
L.latLng(39.7404086497,-105.011288021),
L.latLng(39.7404500982,-105.012875805),
L.latLng(39.7404982942,-105.01449083),
L.latLng(39.7405297263,-105.016047349),
L.latLng(39.7405517288,-105.017602779),
L.latLng(39.7405902855,-105.019288296),
L.latLng(39.7406075104,-105.020925617),
L.latLng(39.7406044929,-105.02247652),
L.latLng(39.7406813549,-105.023259642),
L.latLng(39.7406880604,-105.023335582),
L.latLng(39.7407334904,-105.02387018),
L.latLng(39.741212558,-105.024719182),
L.latLng(39.7419696534,-105.025108019),
L.latLng(39.7429264058,-105.025169039),
L.latLng(39.7440367984,-105.025187563),
L.latLng(39.7452132404,-105.025225701),
L.latLng(39.746409799,-105.02524171),
L.latLng(39.7476125183,-105.025232574),
L.latLng(39.748719642,-105.025183288),
L.latLng(39.7498343094,-105.025185719),
L.latLng(39.7507653712,-105.025213547),
L.latLng(39.7512375238,-105.025371211),
L.latLng(39.7512228135,-105.026164055),
L.latLng(39.7512306087,-105.027274573),
L.latLng(39.7512570536,-105.027682018),
L.latLng(39.7512860969,-105.027730633),
L.latLng(39.7512797267,-105.028104968),
L.latLng(39.7511824966,-105.027792659),
L.latLng(39.7511919262,-105.026871571),
L.latLng(39.7512150603,-105.025900947),
L.latLng(39.7512358055,-105.025451593),
L.latLng(39.7514733905,-105.025181444)
];
*/

/*
var test_points = [[-104.940694375, 39.7221573489], [-104.940695213, 39.7233513929], [-104.940690938, 39.7236789577], [-104.940683814, 39.7245500889], [-104.940688759, 39.724906697], [-104.940670487, 39.7257665964], [-104.940663697, 39.7266051639], [-104.940669816, 39.7269527614], [-104.940632098, 39.728125725], [-104.940640228, 39.7293019155], [-104.940630673, 39.7296218528], [-104.940627236, 39.729953399], [-104.940596977, 39.730417002], [-104.940599995, 39.7316078609], [-104.940612065, 39.7319204221], [-104.940581722, 39.7330562119], [-104.940581638, 39.733395218], [-104.940577028, 39.7345213266], [-104.940580968, 39.7350061778], [-104.940589015, 39.7360081505], [-104.940589853, 39.7365108971], [-104.94059924, 39.7368276911], [-104.940577112, 39.7375852894], [-104.940616926, 39.7382078134], [-104.940622375, 39.7382462863], [-104.940590942, 39.7387015494], [-104.940590188, 39.7389396793], [-104.94060142, 39.7391599138], [-104.940648442, 39.7394640092], [-104.940627068, 39.7398711602], [-104.940625476, 39.7400153289], [-104.940841561, 39.7401879961], [-104.941214472, 39.7402084479], [-104.941953337, 39.740219093], [-104.942262713, 39.7402220685], [-104.943083553, 39.7402369045], [-104.943399048, 39.7402335517], [-104.944048477, 39.7402187577], [-104.944856074, 39.7402317077], [-104.945181375, 39.7402355634], [-104.94596458, 39.7402444482], [-104.946441092, 39.7402462503], [-104.946753234, 39.7402574821], [-104.947372489, 39.7402615892], [-104.947822932, 39.7402683786], [-104.948859606, 39.7402739106], [-104.949146938, 39.7402762575], [-104.949431252, 39.7402826697], [-104.950484354, 39.7402902553], [-104.951279964, 39.7402942367], [-104.951589089, 39.7402880341], [-104.952355865, 39.740280197], [-104.952953663, 39.7402780597], [-104.953288436, 39.7402817477], [-104.953419278, 39.7402892076], [-104.953486584, 39.7402869026], [-104.953692611, 39.7402878246], [-104.953882881, 39.7402902972], [-104.95486876, 39.7402965837], [-104.955362789, 39.7403112939], [-104.955684319, 39.7403254593], [-104.955993528, 39.7403241601], [-104.957154254, 39.7403221066], [-104.958312968, 39.7402822925], [-104.959125677, 39.74015933], [-104.959932352, 39.7400849406], [-104.960890403, 39.7401040933], [-104.961373368, 39.7401077813], [-104.96243963, 39.7401340586], [-104.962698296, 39.7401387524], [-104.963210011, 39.7401451227], [-104.963583173, 39.7401502775], [-104.964518761, 39.7401563125], [-104.964805339, 39.7401534208], [-104.965521153, 39.740168131], [-104.965817202, 39.7401636886], [-104.966396056, 39.740150068], [-104.966825293, 39.7401416861], [-104.967103489, 39.7401390877], [-104.967993898, 39.7401418537], [-104.968271759, 39.7401467152], [-104.968406204, 39.740115325], [-104.968729327, 39.7401254671], [-104.969763905, 39.7401415604], [-104.970083004, 39.740144955], [-104.970843913, 39.7401470924], [-104.971895758, 39.7401457513], [-104.972926397, 39.7401481821], [-104.973218003, 39.7401520796], [-104.973512711, 39.7401493136], [-104.974253504, 39.7401441588], [-104.974532621, 39.7401425662], [-104.975235863, 39.7401235393], [-104.975788901, 39.7401416442], [-104.976158962, 39.74029365], [-104.976153765, 39.7403993458], [-104.976134822, 39.7408143757], [-104.976123758, 39.7409451753], [-104.976129709, 39.7409962211], [-104.976139851, 39.7412252147]]
*/
var test_points = [[-104.678430325, 39.8402230768], [-104.678441892, 39.8389490275], [-104.678501319, 39.8384597758], [-104.678864759, 39.8380486854], [-104.679562887, 39.8379289918], [-104.67980898, 39.8379328056], [-104.680118859, 39.8379402655], [-104.680458577, 39.8379774392], [-104.680873565, 39.8379780678], [-104.681298779, 39.8381384556], [-104.682217185, 39.8382390803], [-104.683151851, 39.8379724939], [-104.684411483, 39.8379439535], [-104.685109528, 39.8379617231], [-104.685755354, 39.8379832646], [-104.686448956, 39.8379757209], [-104.687785702, 39.8380496074], [-104.689317746, 39.8380320054], [-104.69090662, 39.8380549299], [-104.691668702, 39.83801784], [-104.692244707, 39.8380088713], [-104.692609236, 39.8379971367], [-104.692684338, 39.8379975977], [-104.692930095, 39.8375566677], [-104.692954905, 39.8370380374], [-104.692967478, 39.8364751507], [-104.692983236, 39.8353401572], [-104.693052471, 39.8349234509], [-104.693834502, 39.8347067368], [-104.694528356, 39.8347132747], [-104.69632485, 39.834510223], [-104.69858679, 39.8343721731], [-104.701106725, 39.8343324429], [-104.703825396, 39.8343223008], [-104.706578516, 39.8343627435], [-104.707955076, 39.8343728017], [-104.710717499, 39.8343978636], [-104.712087102, 39.8343984923], [-104.713447485, 39.8343979055], [-104.714782303, 39.8343917448], [-104.716148051, 39.8344160105], [-104.71753249, 39.8344190698], [-104.718902847, 39.8344359175], [-104.720322322, 39.8344844487], [-104.721726794, 39.8344529746], [-104.723147024, 39.8344437965], [-104.726039535, 39.8344578781], [-104.728824003, 39.8344714148], [-104.730166448, 39.834508379], [-104.731463967, 39.8345035175], [-104.732772382, 39.8345106421], [-104.735264825, 39.8345276993], [-104.73780429, 39.8345596763], [-104.740478452, 39.8345693993], [-104.741831627, 39.8345535156], [-104.743197877, 39.8345594248], [-104.744586507, 39.8345390568], [-104.747482035, 39.8345377995], [-104.748935877, 39.834557497], [-104.751811707, 39.8345945031], [-104.753268734, 39.834595467], [-104.754712852, 39.8345769849], [-104.756173315, 39.8345904379], [-104.757618522, 39.8345968081], [-104.759073285, 39.8345978978], [-104.761973843, 39.8346298328], [-104.763426427, 39.8346442916], [-104.764909437, 39.8346675514], [-104.766377863, 39.8346767715], [-104.767840337, 39.8346412322], [-104.769281438, 39.8345336086], [-104.772149474, 39.8340699636], [-104.773556795, 39.8337102542], [-104.77492162, 39.8332871776], [-104.777473239, 39.8322452233], [-104.778673695, 39.831635356], [-104.779802654, 39.8309582239], [-104.781843396, 39.8294176301], [-104.782791222, 39.8285762547], [-104.783642404, 39.8276586039], [-104.78440172, 39.8266783404], [-104.785120133, 39.825661867], [-104.785725726, 39.824641035], [-104.786607754, 39.8225602694], [-104.786897348, 39.8214528105], [-104.787143776, 39.8203560384], [-104.787271852, 39.8192298878], [-104.787291382, 39.8181088083], [-104.787254585, 39.8159520608], [-104.787251065, 39.8148631677], [-104.787285263, 39.8137720116], [-104.787256345, 39.8115637154], [-104.787240336, 39.8104571365], [-104.787232038, 39.8093764997], [-104.787246287, 39.808266568]]
  .map(function(d) {return L.latLng(d[1], d[0]);});

var candidates_list = [],
    transitions = [],
    viterbi = [],
    candidate_markers = [],
    selectedNodes = [],
    chosen_candidates = [],
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
      height = layout.getHeight(lists[0].length),
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
            color: computeColor((viterbi[i][j] - minViterbi[i]) /  (maxViterbi[i] - minViterbi[i]))
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
  broken = response.debug.broken;
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

router._routeDone = routingShim;

lrm.setWaypoints(test_points);



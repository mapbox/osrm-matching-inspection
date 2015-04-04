var cover = require('tile-cover'),
    turf = require('turf'),
    tilebelt = require('tilebelt'),
    fs = require('fs');

if (process.argv.length < 3) {
  console.error("Usage: node geojson2bins.js data.geojson");
  console.error("Will print geojson of the bined traces on stdout.");
  process.exit(1);
}

var file = process.argv[2],
    data = JSON.parse(fs.readFileSync(file)),
    bins = {},
    opts = {min_zoom: 22, max_zoom: 22};

data.forEach(function (feature) {
  var tiles = cover.tiles(feature.geometry, opts);
  for(var i = 0; i < tiles.length; i++) {
    key = tiles[i][0]+'/'+tiles[i][1]+'/'+tiles[i][2];
    if (bins[key] === undefined) bins[key] = 0;
    bins[key]++;
  }
});

var collection = Object.keys(bins).map(function (key) {
  var tile = key.split('/').map(function(i) { return parseInt(i); });
  //var poly = turf.centroid(turf.polygon(tilebelt.tileToGeoJSON(tile).coordinates));
  var poly = turf.polygon(tilebelt.tileToGeoJSON(tile).coordinates);
  poly.properties.count = bins[key];
  return poly;
});

var collection = turf.featurecollection(collection);

console.log(JSON.stringify(collection));

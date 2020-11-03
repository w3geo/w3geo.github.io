var track = 'js/track.gpx';
var maxRotation = Math.PI / 1000;
var maxHistory = 48;
var speed = 2;

var raster = new ol.layer.Tile({
  preload: 5,
  source: new ol.source.Stamen({
    layer: 'watercolor'
  })
});

var style = new ol.style.Style({
  image: new ol.style.Circle({
    fill: new ol.style.Fill({
      color: 'rgb(255,240,0)'
    }),
    stroke: new ol.style.Stroke({
      color: 'rgb(255,170,0)',
      width: 1.5
    }),
    radius: 5.5
  }),
  stroke: new ol.style.Stroke({
    color: 'rgb(50,200,50)',
    width: 2
  })
});

var source = new ol.source.Vector({
  url: track,
  format: new ol.format.GPX()
});

var past = [];
var vector = new ol.layer.Vector({
  source: source,
  style: function(feature, resolution) {
    var deltaTime;
    if (playing) {
      deltaTime = speed * ((Date.now() / 1000) - originM);
    } else if (stopM) {
      deltaTime = speed * (stopM - originM);
    } else {
      deltaTime = 0;
    }
    var line = feature.getGeometry().getLineString(0);
    var time = stats.minTime + deltaTime;
    if (time > stats.maxTime) {
      time = stats.maxTime;
      reset();
    }
    var coord = line.getCoordinateAtM(time, true);
    var next = line.getCoordinateAtM(time + speed, true);
    var nextRotation = Math.atan2(next[1] - coord[1], next[0] - coord[0]) - Math.PI / 2
    var rotation = view.getRotation();
    var deltaRotation = nextRotation - rotation;
    if (deltaRotation > maxRotation) {
      view.setRotation(rotation + maxRotation);
    } else if (deltaRotation < -maxRotation) {
      view.setRotation(rotation - maxRotation);
    } else {
      view.setRotation(nextRotation);
    }
    view.setCenter(coord);

    var point = new ol.geom.Point(coord, 'XYZM');
    past.unshift(point);
    style.setGeometry(new ol.geom.GeometryCollection([line, point]));
    return [style];
  }
});

var view = new ol.View({
  center: [0, 0],
  zoom: 0
});

var map = new ol.Map({
  loadTilesWhileAnimating: true,
  loadTilesWhileInteracting: true,
  target: document.getElementById('map'),
  layers: [raster, vector],
  controls: [],
  interactions: [],
  view: view
});

var timeRange = null;

var stats = {
  minTime: Infinity,
  maxTime: -Infinity,
  minZ: Infinity,
  maxZ: -Infinity,
  lengths: [],
  coordinates: []
};

function distance(from, to) {
  var dx = to[0] - from[0];
  var dy = to[1] - from[1];
  return Math.sqrt(dx * dx + dy * dy);
}

source.on('addfeature', function(event) {
  var line = event.feature.getGeometry().getLineString(0);
  var coords = line.getCoordinates();
  var first = coords[0];
  var num = coords.length;
  var last = coords[num - 1];
  stats.minTime = first[3];
  stats.maxTime = last[3];
  for (var i = 0; i < num; ++i) {
    var z = coords[i][2];
    if (z < stats.minZ) {
      stats.minZ = z;
    }
    if (z > stats.maxZ) {
      stats.maxZ = z;
    }
    if (i === 0) {
      stats.lengths.push(0);
    } else {
      stats.lengths.push(
          distance(coords[i - 1], coords[i]) + stats.lengths[i - 1]);
    }
  }
  stats.coordinates = coords;
  view.setCenter(first);
  view.setZoom(16);
});

var playing = false;
var originM;
function start() {
  originM = Date.now() / 1000;
  playing = true;
  stopM = null;
  source.changed();
  document.cookie = 'originM=' + originM + '; expires=Fri, 31 Dec 9999 23:59:59 GMT';
}

var stopM;
function stop() {
  stopM = Date.now() / 1000;
  playing = false;
  document.cookie = 'stopM=' + stopM + '; expires=Fri, 31 Dec 9999 23:59:59 GMT';
  document.cookie = 'rotationM=' + view.getRotation() + '; expires=Fri, 31 Dec 9999 23:59:59 GMT';
}

function resume() {
  if (!originM) {
    originM = parseFloat(
        document.cookie.replace(/(?:(?:^|.*;\s*)originM\s*\=\s*([^;]*).*$)|^.*$/, '$1'));
  }
  if (!stopM) {
    stopM = parseFloat(
        document.cookie.replace(/(?:(?:^|.*;\s*)stopM\s*\=\s*([^;]*).*$)|^.*$/, '$1'));
    var rotation = parseFloat(
        document.cookie.replace(/(?:(?:^|.*;\s*)rotationM\s*\=\s*([^;]*).*$)|^.*$/, '$1'));
    if (rotation) {
      view.setRotation(rotation);
    }
  }
  if (!originM || !stopM) {
    start();
    return;
  }
  originM += (Date.now() / 1000) - stopM;
  playing = true;
  source.changed();
}

function reset() {
  stop();
  stopM = null;
  window.setTimeout(start, 10000);
}

window.addEventListener('beforeunload', stop);

map.on('singleclick', function() {
  if (playing) {
    stop();
  } else if (stopM) {
    resume();
  } else {
    start();
  }
});

map.on('postcompose', function(event) {
  if (playing) {
    var vectorContext = event.vectorContext;
    var len = Math.min(maxHistory, past.length);
    for (var i = 0; i < len; i += 6) {
      vectorContext.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          fill: new ol.style.Fill({
            color: 'rgba(255,240,0, ' + (1 - i / len) + ')'
          }),
          radius: 8
        })
      }));
      vectorContext.drawGeometry(past[i]);
    }
    past.length = len;
    plot(event.context);
    setTimeout(function() {
      source.changed();
    }, 16);
  } else {
    past.length = 0;
  }
});
resume();

function plot(context) {
  var canvas = context.canvas;
  var width = canvas.width;
  var bottom = canvas.height;
  var height = bottom / 5;

  var rangeZ = stats.maxZ - stats.minZ;
  var rangeX = stats.lengths[stats.lengths.length - 1];

  // full plot
  context.beginPath();
  context.moveTo(0, bottom);
  for (var i = 0, ii = stats.coordinates.length; i < ii; i += 2) {
    var coord = stats.coordinates[i];
    var deltaZ = coord[2] - stats.minZ;
    var x = width * stats.lengths[i] / rangeX;
    var y = bottom - height * deltaZ / rangeZ;
    context.lineTo(x, y);
  }
  context.lineTo(width, bottom);
  context.closePath();
  context.fillStyle = 'rgba(0,0,0,0.6)';
  context.fill();

  // current progress
  if (past.length < 1) {
    return;
  }
  var now = past[0].getCoordinates()[3];
  context.beginPath();
  context.moveTo(0, bottom);
  for (var i = 0, ii = stats.coordinates.length; i < ii; i += 2) {
    var coord = stats.coordinates[i];
    if (coord[3] > now) {
      break;
    }
    var deltaZ = coord[2] - stats.minZ;
    var x = width * stats.lengths[i] / rangeX;
    var y = bottom - height * deltaZ / rangeZ;
    context.lineTo(x, y);
  }
  context.lineTo(x, bottom);
  context.closePath();
  context.fillStyle = 'rgba(50,170,50,0.5)';
  context.fill();
}

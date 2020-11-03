// creating the view
var view = new ol.View({
  center: ol.proj.fromLonLat([5.8713, 45.6452]),
  zoom: 18
});

// creating the map
var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      opacity: 0.3,
      source: new ol.source.Stamen({
        layer: 'terrain'
      })
    })
  ],
  target: 'map',
  controls: [new ol.control.Attribution({collapsible: false})],
  interactions: [],
  view: view
});


// LineString to store the different geolocation positions. This LineString
// is time aware.
// The Z dimension is actually used to store the rotation (heading).
var positions = new ol.geom.LineString([],
    /** @type {ol.geom.GeometryLayout} */ ('XYZM'));

// Geolocation Control
var geolocation = new ol.Geolocation(/** @type {olx.GeolocationOptions} */ ({
  projection: view.getProjection(),
  trackingOptions: {
    maximumAge: 10000,
    enableHighAccuracy: true,
    timeout: 600000
  }
}));

var deltaMean = 500; // the geolocation sampling period mean in ms

// Listen to position changes
geolocation.on('change', function() {
  var position = geolocation.getPosition();
  var heading = geolocation.getHeading() || 0;
  var speed = geolocation.getSpeed() || 0;
  var m = Date.now();

  addPosition(position, heading, m, speed);

  var coords = positions.getCoordinates();
  var len = coords.length;
  if (len >= 2) {
    deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
  }

/*
  var html = [
    'Position: ' + ol.coordinate.toStringHDMS(ol.proj.transform(
        position, 'EPSG:3857', 'EPSG:4326')),
    'Heading: ' + Math.round(radToDeg(heading)) + '&deg;',
    'Speed: ' + (speed * 3.6).toFixed(1) + ' km/h'
  ].join('<br />');
  document.getElementById('info').innerHTML = html;
*/
});

geolocation.on('error', function() {
  alert('geolocation error');
  // FIXME we should remove the coordinates in positions
});

// convert radians to degrees
function radToDeg(rad) {
  return rad * 360 / (Math.PI * 2);
}
// convert degrees to radians
function degToRad(deg) {
  return deg * Math.PI * 2 / 360;
}
// modulo for negative values
function mod(n) {
  return ((n % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
}

function addPosition(position, heading, m, speed) {
  var x = position[0];
  var y = position[1];
  var fCoords = positions.getCoordinates();
  var previous = fCoords[fCoords.length - 1];
  var prevHeading = previous && previous[2];
  if (prevHeading) {
    var headingDiff = heading - mod(prevHeading);

    // force the rotation change to be less than 180°
    if (Math.abs(headingDiff) > Math.PI) {
      var sign = (headingDiff >= 0) ? 1 : -1;
      headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
    }
    heading = prevHeading + headingDiff;
  }
  positions.appendCoordinate([x, y, heading, m]);

  // only keep the 20 last coordinates
  positions.setCoordinates(positions.getCoordinates().slice(-20));

}

var previousM = 0;
// change center and rotation before render
map.beforeRender(function(map, frameState) {
  if (frameState !== null) {
    // use sampling period to get a smooth transition
    var m = frameState.time - deltaMean * 1.5;
    m = Math.max(m, previousM);
    previousM = m;
    // interpolate position along positions LineString
    var c = positions.getCoordinateAtM(m, true);
    var view = frameState.viewState;
    if (c) {
      view.center = getCenterWithHeading(c, -c[2], view.resolution);
      view.rotation = -c[2];
    }
  }
  return true; // Force animation to continue
});

// recenters the view by putting the given coordinates at 3/4 from the top or
// the screen
function getCenterWithHeading(position, rotation, resolution) {
  var size = map.getSize();
  var height = size[1];

  return [
    position[0] - Math.sin(rotation) * height * resolution * 1 / 4,
    position[1] + Math.cos(rotation) * height * resolution * 1 / 4
  ];
}

// postcompose callback
function render() {
  map.render();
}

// simulate device move
var simulationData;
var client = new XMLHttpRequest();
client.open('GET', '/background/geolocation-orientation.json');


/**
 * Handle data loading.
 */
client.onload = function() {
  simulationData = JSON.parse(client.responseText).data;
  simulate();
};
client.send();

function simulate() {
  var coordinates = simulationData.slice().concat(simulationData.slice().reverse());

  var first = coordinates.shift();
  simulatePositionChange(first);

  var prevDate = first.timestamp;
  function geolocate() {
    if (coordinates.length == 0) {
      coordinates = simulationData.slice().concat(simulationData.slice().reverse());
    }
    var position = coordinates.shift();
    if (!position) {
      return;
    }
    var newDate = position.timestamp;
    var delta =  newDate - prevDate;
    simulatePositionChange(position, delta < 0);
    window.setTimeout(function() {
      prevDate = newDate;
      geolocate();
    }, (delta > 0 ? delta : -delta));
  }
  geolocate();

  map.on('postcompose', render);
  map.render();
}

function simulatePositionChange(position, invert) {
  var coords = position.coords;
  var heading = degToRad(coords.heading);
  if (invert) {
    heading = mod(heading - Math.PI);
  }
  geolocation.set('accuracy', coords.accuracy);
  geolocation.set('heading', heading);
  var position_ = [coords.longitude, coords.latitude];
  var projectedPosition = ol.proj.transform(position_, 'EPSG:4326',
      'EPSG:3857');
  geolocation.set('position', projectedPosition);
  geolocation.set('speed', coords.speed);
  geolocation.changed();
}

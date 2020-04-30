function init(config) {

  const inactive = {
    color: "blue",
    weight: 1
  };

  const active = {
    color: "orange",
    weight: 1
  };

  const map = L.map("map", config.mapOption);

  L.tileLayer('https://maps.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
    attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
  }).addTo(map);


  const bounds = config.bounds;

  const group = L.geoJson({
    type: "FeatureCollection",
    features: []
  }, {
    style: inactive,
    onEachFeature: function(feature, layer) {
      layer.bindTooltip(feature.properties.MESH_NO);
    },
    attribution: config.attribution
  }).addTo(map);

  const update = function() {
    const box = L.latLngBounds(markers.map(m => m.getLatLng()));
    rectangle.setBounds(box);

    const urls = [];
    group.getLayers().forEach((layer, i) => {
      if (layer.getBounds().intersects(box)) {
        layer.setStyle(active);
        const url = layer.feature.properties.URL;
        if (urls.indexOf(url) === -1) urls.push(url);
      } else {
        layer.setStyle(inactive);
      }
    });
    document.getElementById("count").innerHTML = urls.length;
    document.getElementById("urls").textContent = urls.join("\n");
  };

  const rectangle = L.rectangle(bounds, {
    color: "#666666",
    weight: 1
  }).addTo(map);

  const markers = [
    bounds.getNorthWest(),
    bounds.getSouthEast()
  ].map(p => L.marker(p, {
    draggable: true
  }).on("move", function() {
    rectangle.setBounds(L.latLngBounds(markers.map(m => m.getLatLng())));
  }).on("dragend", update).addTo(map));

  update();

  Object.assign(L.gridLayer(config.pbfOption), {
    createTile: function(coords) {
      fetch(L.Util.template(this.options.url, coords)).then(a => a.arrayBuffer()).then(buffer => {
        var layers = new VectorTile(new Pbf(buffer)).layers;
        Object.keys(layers).forEach(name => {
          var layer = layers[name];
          for (var i = 0; i < layer.length; i++) {
            group.addData(layer.feature(i).toGeoJSON(coords.x, coords.y, coords.z));
          }
        });
        update();
      });
      return document.createElement('div');
    }
  }).addTo(map);

}

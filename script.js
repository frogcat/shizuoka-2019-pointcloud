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

  const cells = {};

  const update = function() {
    const box = L.latLngBounds(markers.map(m => m.getLatLng()));
    rectangle.setBounds(box);

    const urls = [];
    Object.keys(cells).filter(url => {
      const layer = cells[url];
      if (layer.getBounds().intersects(box)) {
        layer.setStyle(active);
        urls.push(url);
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
      fetch(L.Util.template(this.options.url, coords)).then(a => a.ok ? a.arrayBuffer() : null).then(buffer => {
        if (buffer === null) return;
        var layers = new VectorTile(new Pbf(buffer)).layers;
        Object.keys(layers).forEach(name => {
          var layer = layers[name];
          for (var i = 0; i < layer.length; i++) {
            const json = layer.feature(i).toGeoJSON(coords.x, coords.y, coords.z);
            const bbox = L.latLngBounds(json.geometry.coordinates[0].map(x => x.reverse()));
            const url = json.properties.URL;
            if (cells[url] === undefined) {
              cells[url] = L.rectangle(bbox, Object.assign({
                attribution: config.attribution
              }, inactive)).bindTooltip(json.properties.MESH_NO).addTo(map);
            } else {
              cells[url].setBounds(cells[url].getBounds().extend(bbox));
            }
          }
        });
        update();
      });
      return document.createElement('div');
    }
  }).addTo(map);

}

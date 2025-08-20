const fs = require('fs')
const turf = {
  buffer: require('@turf/buffer').default
}

module.exports = function render2GeoJSON (list) {
  const features = []

  Object.values(list)
    .flat()
    .forEach(item => {
      const geojson = item.object.GeoJSON()

      item.data.styles.forEach(style => {
        let properties = style === 'default' ? item.data.style : item.data['style:' + style]
        let geometry = geojson.geometry

        if (properties.geometry) {
          try {
            geometry = JSON.parse(properties.geometry)
          }
          catch (e) {
            console.error("Can't parse geometry: \"" + properties.geometry + "\"")
            return
          }
        }

        if (!properties || !geometry) {
          return
        }

        if (geometry.type === 'Point') {
          let radius = parseFloat(properties.radius ?? 10)
          switch (properties.nodeFeature ?? 'CircleMarker') {
            case 'CircleMarker':
              radius = radius * metersPerPixel / 1000
              /* fallthrough */
            case 'Circle':
              geometry = turf.buffer(geometry, radius, {unit: 'meters'}).geometry
          }
        }

        features.push({
          type: 'Feature',
          geometry,
          properties
        })
      })
    })

  features
    .sort((a, b) => {
      return (a.properties.zIndex ?? 0) - (b.properties.zIndex ?? 0)
    })

  fs.writeFileSync('data.geojson', JSON.stringify({
    type: 'FeatureCollection',
    features
  }))
}

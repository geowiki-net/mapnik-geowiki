const fs = require('fs')
const turf = {
  buffer: require('@turf/buffer').default
}

const BoundingBox = require('boundingbox')
const fieldConfig = require('./fieldConfig.json')
const mapnikSymbolizerFunctions = require('./mapnikSymbolizerFunctions.js')
const isTrue = require('./isTrue')
const parseLength = require('@geowiki-net/geowiki-layer/src/parseLength.js')

module.exports = function render2GeoJSON (list, options) {
  const features = []

  const metersPerPixel = 40075016.686 * Math.abs(Math.cos(new BoundingBox(options.bbox).getCenter().lat / 180 * Math.PI)) / Math.pow(2, options.zoom + 8)

  Object.values(list)
    .flat()
    .forEach(item => {
      const geojson = item.object.GeoJSON()

      Object.values(item.getStyles()).forEach(properties => {
        let geometry = geojson.geometry

        if (properties.geometry) {
          try {
            geometry = JSON.parse(properties.geometry)
          } catch (e) {
            console.error("Can't parse geometry: \"" + properties.geometry + '"')
            return
          }
        }

        if (!properties || !geometry) {
          return
        }

        Object.entries(fieldConfig).forEach(([key, def]) => {
          switch (def.type) {
            case 'boolean':
              properties[key] = isTrue(properties[key])
              break
            case 'length':
              properties[key] = parseLength(properties[key], metersPerPixel)
              break
            case 'array-length':
              properties[key] = properties[key].split(/,/g).map(v => parseLength(v, metersPerPixel)).join(',')
              break
          }

          if (def.valueMapping) {
            const v = properties[key].trim()
            if (v in def.valueMapping) {
              properties[key] = def.valueMapping[v]
            }
          }
        })

        Object.entries(mapnikSymbolizerFunctions).forEach(([key, def]) => {
          properties[key] = def.fun(properties)
        })

        Object.keys(properties).forEach(key => {
          if (typeof properties[key] === 'string') {
            properties[key] = properties[key].trim()
          }
        })

        if (geometry.type === 'Point') {
          let radius = parseFloat(properties.radius ?? 10)
          switch (properties.nodeFeature ?? 'CircleMarker') {
            case 'CircleMarker':
              radius = radius * metersPerPixel / 1000
              /* fallthrough */
            case 'Circle':
              geometry = turf.buffer(geometry, radius, { unit: 'meters' }).geometry
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

  fs.writeFileSync(options.tmpDir + '/data.geojson', JSON.stringify({
    type: 'FeatureCollection',
    features
  }))
}

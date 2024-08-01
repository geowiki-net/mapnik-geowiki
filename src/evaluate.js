const OverpassFrontend = require('overpass-frontend')

function evaluate (options, callback) {
  const features = []

  options.overpassFrontend.BBoxQuery(
    options.query,
    options.bbox,
    {
      properties: OverpassFrontend.ALL
    },
    (err, item) => {
      const twigData = {
        tags: item.tags
      }

      const geojson = item.GeoJSON()
      geojson.properties = {color: '#00ff00'}
      features.push(geojson)
    },
    (err) => {
      callback(err, features)
    }
  )
}

module.exports = evaluate

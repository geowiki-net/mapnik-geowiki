const styles2mapnik = require('./styles2mapnik')
const getStyleFieldValues = require('./getStyleFieldValues')
const fs = require('fs')
const compileQueries = require('./compileQueries')
const compileLayerFunctions = require('./compileLayerFunctions')
const createPLV8Functions = require('./createPLV8Functions')
const getZoomLevels = require('./getZoomLevels')
const zoomToScale = require('./zoomToScale')
const twigRender = require('./twigRender')

const template = fs.readFileSync('template.xml').toString()
const templateLayer = fs.readFileSync('template-styles-layers.xml').toString()

module.exports = function compile (data, options) {
  if (!data.layers) {
    data.layers = [data]
  }

  const styleFieldValues = getStyleFieldValues(data.layers, options)

  const zoomLevels = getZoomLevels(data.layers, options)

  const rules = styles2mapnik(data.layers, styleFieldValues, options)

  const layers = zoomLevels.map((zoom, i) => {
    const maxScale = zoomToScale(zoom)
    const maxZoom = zoomLevels[i + 1]
    const minScale = zoomToScale(maxZoom ?? 30)

    const query = compileQueries(data.layers, zoom, styleFieldValues, options)

    let layer = templateLayer.replace(/%layerid%/g, 'ID' + i)
    layer = layer.replace(/%styleid%/g, 'ID')
    layer = layer.split('%query%').join(query)
    layer = layer.replace('%minScale%', minScale)
    layer = layer.replace('%maxScale%', maxScale)

    return layer
  }).join('\n')

  let stylesheet = twigRender(template, {
    background: data.background ?? '#ffffff'
  })
  stylesheet = stylesheet.replace(/%id%/g, 'ID')
  stylesheet = stylesheet.replace('%rules%', rules)
  stylesheet = stylesheet.split('%layers%').join(layers)

  const sqlFuncs = compileLayerFunctions(data.layers, styleFieldValues, data, options)

  createPLV8Functions(sqlFuncs, options, (err, file) => {
    if (err) { return console.error(err) }
    const filename = options.id + '.sql'

    fs.writeFile(filename, file, (err) => {
      if (err) { return console.error(err) }

      console.log('create ' + filename)
    })
  })

  return stylesheet
}

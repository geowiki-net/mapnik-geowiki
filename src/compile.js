const styles2mapnik = require('./styles2mapnik')
const fs = require('fs')
const path = require('path')
const getZoomLevels = require('./getZoomLevels')
const zoomToScale = require('./zoomToScale')
const twigRender = require('./twigRender')
const mergeStyleFieldValues = require('./mergeStyleFieldValues')
const Layer = require('./Layer')

const repoPath = __filename.split('/').slice(0, -2).join('/') + '/templates/'
const template = fs.readFileSync(repoPath + 'template.xml').toString()
const templateLayer = fs.readFileSync(repoPath + 'template-styles-layers.xml').toString()

module.exports = function compile (data, options) {
  const layers = data.layers.map((l, i) => new Layer(i, l, data, options))
  const layerStyleFieldValues = layers.map(layer => layer.getStyleFieldValues())
  const styleFieldValues = mergeStyleFieldValues(layerStyleFieldValues)

  const zoomLevels = getZoomLevels(data.layers, options)

  const rules = styles2mapnik(data.layers, styleFieldValues, options)

  const mapnikLayers = zoomLevels.map((zoom, i) => {
    const maxScale = zoomToScale(zoom)
    const maxZoom = zoomLevels[i + 1]
    const minScale = zoomToScale(maxZoom ?? 30)

    let layer = templateLayer.replace(/%layerid%/g, 'ID' + i)
    layer = layer.replace(/%styleid%/g, 'ID')
    layer = layer.replace('%minScale%', minScale)
    layer = layer.replace('%maxScale%', maxScale)

    return layer
  }).join('\n')

  let stylesheet = twigRender(template, {
    background: data.background ?? '#ffffff'
  })
  stylesheet = stylesheet.replace(/%id%/g, 'ID')
  stylesheet = stylesheet.replace('%rules%', rules)
  stylesheet = stylesheet.split('%layers%').join(mapnikLayers)

  return stylesheet
}

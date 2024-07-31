const styles2mapnik = require('./styles2mapnik')
const getStyleFieldValues = require('./getStyleFieldValues')
const fs = require('fs')
const compileSelects = require('./compileSelects')
const createPLV8Functions = require('./createPLV8Functions')
const getZoomLevels = require('./getZoomLevels')
const zoomToScale = require('./zoomToScale')
const twigRender = require('./twigRender')
const Layer = require('./Layer')

const template = fs.readFileSync('template.xml').toString()
const templateLayer = fs.readFileSync('template-styles-layers.xml').toString()

module.exports = function compile (data, options) {
  const layers = data.layers.map((l, i) => new Layer(i, l, data, options))
  const styleFieldValues = getStyleFieldValues(data.layers, options)
  const zoomLevels = getZoomLevels(data.layers, options)

  const rules = styles2mapnik(data.layers, styleFieldValues, options)

  const mapnikLayers = zoomLevels.map((zoom, i) => {
    const maxScale = zoomToScale(zoom)
    const maxZoom = zoomLevels[i + 1]
    const minScale = zoomToScale(maxZoom ?? 30)

    const tables = layers.map(l => {
      if (!l.zoomLevelActive(zoom)) {
        return null
      }

      return l.compileLayerTable()
    }).filter(s => s).join(' union all ')

    let selects = compileSelects(tables, styleFieldValues, options)

    selects = selects.replace(/</g, '&lt;')
    selects = selects.replace(/>/g, '&gt;')

    let layer = templateLayer.replace(/%layerid%/g, 'ID' + i)
    layer = layer.replace(/%styleid%/g, 'ID')
    layer = layer.split('%query%').join(selects)
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

  const sqlFuncs = layers.map(l => l.compileFunction(styleFieldValues))

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

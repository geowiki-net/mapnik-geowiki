const styles2mapnik = require('./styles2mapnik')
const getStyleFieldValues = require('./getStyleFieldValues')
const fs = require('fs')
const compileQueries = require('./compileQueries')
const compileLayerFunctions = require('./compileLayerFunctions')
const createPLV8Functions = require('./createPLV8Functions')
const twigRender = require('./twigRender')

const template = fs.readFileSync('template.xml').toString()
const templateLayer = fs.readFileSync('template-styles-layers.xml').toString()

module.exports = function compile (data, options) {
  if (!data.layers) {
    data.layers = [data]
  }

  const styleFieldValues = getStyleFieldValues(data.layers, options)

  const query = compileQueries(data.layers, styleFieldValues, options)

  const rules = styles2mapnik(data.layers, styleFieldValues, options)

  let layer = templateLayer.replace(/%id%/g, 'ID')
  layer = layer.split('%query%').join(query)
  layer = layer.replace('%rules%', rules)

  let stylesheet = twigRender(template, {
    background: data.background ?? '#ffffff'
  })
  stylesheet = stylesheet.split('%styles-layers%').join(layer)

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

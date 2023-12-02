const styles2mapnik = require('./styles2mapnik')
const getStyleFieldValues = require('./getStyleFieldValues')
const fs = require('fs')
const compileQueries = require('./compileQueries')
const compileLayerFunctions = require('./compileLayerFunctions')
const createPLV8Functions = require('./createPLV8Functions')

const template = fs.readFileSync('template.xml').toString()
const templateLayer = fs.readFileSync('template-styles-layers.xml').toString()

module.exports = function compile (data) {
  if (!data.layers) {
    data.layers = [data]
  }

  const styleFieldValues = getStyleFieldValues(data.layers)

  const query = compileQueries(data.layers, styleFieldValues)

  const rules = '<Rule>' + styles2mapnik(data.layers, styleFieldValues) + '</Rule>'

  let layer = templateLayer.replace(/%id%/g, 'ID')
  layer = layer.split('%query%').join(query)
  layer = layer.replace('%rules%', rules)

  const stylesheet = template.split('%styles-layers%').join(layer)

  const sqlFuncs = compileLayerFunctions(data.layers, styleFieldValues)

  createPLV8Functions(sqlFuncs, (err, file) => {
    if (err) { return console.error(err) }
    fs.writeFile('mapnik.sql', file, (err) => {
      if (err) { return console.error(err) }

      console.log('create mapnik.sql')
    })
  })

  return stylesheet
}

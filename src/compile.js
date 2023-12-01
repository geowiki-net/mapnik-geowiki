const es6ToPlv8 = require('es6-to-plv8')
const styles2mapnik = require('./styles2mapnik')
const getStyleFieldValues = require('./getStyleFieldValues')
const fs = require('fs')
const compileQueries = require('./compileQueries')
const compileLayerFunctions = require('./compileLayerFunctions')

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

  const sqlFunc = compileLayerFunctions(data.layers)

  fs.writeFileSync('_tmp.js', sqlFunc)
  const def = {}
  data.layers.forEach((layer, i) => {
    def['layer' + i] = {"returns":"json","params":[{"type":"text","name":"type"},{"type":"bigint","name":"id"},{"type":"json","name":"tags"}]};
  })
  fs.writeFileSync('_tmp.def', JSON.stringify(def))

  es6ToPlv8({
    namespace: 'Test',
    file: '_tmp.js',
    outfile: 'mapnik.sql',
    definitions: '_tmp.def',
  })

  return stylesheet
}

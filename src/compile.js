const OverpassFrontend = require('overpass-frontend')
const es6ToPlv8 = require('es6-to-plv8')
const filter2mapnik = require('./filter2mapnik')
const style2mapnik = require('./style2mapnik')
const fs = require('fs')

const template = fs.readFileSync('template.xml').toString()
const templateLayer = fs.readFileSync('template-styles-layers.xml').toString()

module.exports = function compile (data) {
  const filter = new OverpassFrontend.Filter(data.query)
  const templates = []

  const rules = '<Rule>' + style2mapnik(data.feature.style, templates) + '</Rule>'
  console.log(templates)

  const query = 'select ' + templates.map((t, i) => `exprs->>${i} expr${i}`).join(', ') + ', way from (select Test__tmp(type, osm_id, hstore_to_json(tags)) exprs, way from (' + filter2mapnik(filter.sets._) + ') t) t'

  let layer = templateLayer.replace(/%id%/g, 'ID')
  layer = layer.split('%query%').join(query)
  layer = layer.replace('%rules%', rules)

  const stylesheet = template.split('%styles-layers%').join(layer)

  let sqlFunc = fs.readFileSync('sqlFunc.template.js').toString()
  sqlFunc = sqlFunc.replace('%templates%', templates.map(t => {
      return '  twigRender(' + JSON.stringify(t) + ', data)'
    }).join(',\n'))

  fs.writeFileSync('_tmp.js', sqlFunc)
  fs.writeFileSync('_tmp.def', '{"_tmp":{"returns":"json","params":[{"type":"text","name":"type"},{"type":"bigint","name":"id"},{"type":"json","name":"tags"}]}}')

  es6ToPlv8({
    namespace: 'Test',
    file: '_tmp.js',
    outfile: 'mapnik.sql',
    definitions: '_tmp.def',
  })

  return stylesheet
}

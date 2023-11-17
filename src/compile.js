const OverpassFrontend = require('overpass-frontend')
const filter2mapnik = require('./filter2mapnik')
const fs = require('fs')

const template = fs.readFileSync('template.xml').toString()
const templateLayer = fs.readFileSync('template-styles-layers.xml').toString()

module.exports = function compile (data) {
  const filter = new OverpassFrontend.Filter(data.query)
  const query = filter2mapnik(filter.sets._)

  const rules = `
<Rule>
<PolygonSymbolizer fill="#7e2867" gamma="0" />
<LineSymbolizer stroke="#7e2867" stroke-width="0.5" />
</Rule>`

  let layer = templateLayer.replace(/%id%/g, 'ID')
  layer = layer.split('%query%').join(query)
  layer = layer.replace('%rules%', rules)

  const result = template.split('%styles-layers%').join(layer)

  return result
}

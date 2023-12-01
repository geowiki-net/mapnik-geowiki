const OverpassFrontend = require('overpass-frontend')
const filter2mapnik = require('./filter2mapnik')

module.exports = function compileQueries (layers, fields) {
  const queries = layers.map(layer => {
    const filter = new OverpassFrontend.Filter(layer.query)
    return filter2mapnik(filter.sets._)
  })

  const query = '(' + queries.join(') or (', queries) + ')'
  const selects = Object.entries(fields).map(([field, values]) => {
    if (values.length > 1 || values.includes(undefined)) {
      const escField = field.replace('-', '_')
      return `exprs->>"${field}" ${escField}`
    }

    return null
  }).filter(v => v).join(', ')

  return 'select ' + selects + ', way from (select Test__tmp(type, osm_id, hstore_to_json(tags)) exprs, way from (' + query + ') t) t'
}

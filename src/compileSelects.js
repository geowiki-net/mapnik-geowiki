const OverpassFrontend = require('overpass-frontend')
const filter2mapnik = require('./filter2mapnik')

module.exports = function compileQueries (tables, fields, options) {
  const selects = Object.entries(fields).map(([field, values]) => {
    if (values.length > 1 || values.includes(undefined)) {
      const escField = field.replace('-', '_')
      return `exprs->>'${field}' "${escField}"`
    }

    return null
  }).filter(v => v)

  selects.push("(exprs->>'way')::geometry \"way\"")

  let result = 'select ' + selects.join(', ') + ' from (' + tables + ') t order by (exprs->>\'zIndex\')::float asc, (exprs->>\'way_area\')::float desc'
  return result
}

const OverpassFrontend = require('overpass-frontend')
const filter2mapnik = require('./filter2mapnik')

module.exports = function compileQueries (layers, zoom, fields, options) {
  const layerQs = layers.map((layer, i) => {
    let layerQuery = null
    if (typeof layer.query === 'string') {
      layerQuery = layer.query
    } else {
      layerQuery = Object.entries(layer.query)
        .filter(([ z, q ]) => z <= zoom)
        .reverse()
      if (!layerQuery.length) {
        return null
      }

      layerQuery = layerQuery[0][1]
    }

    const filter = new OverpassFrontend.Filter(layerQuery)
    const query = filter2mapnik(filter.sets._)

    let funcname = options.id + '_layer_' + i
    if (options.schema) {
      funcname = options.schema + '.' + funcname
    }

    return '(select unnest(' + funcname + '(type, osm_id, hstore_to_json(tags), json_build_object(\'scale_denominator\', !scale_denominator!, \'zoom\', round(log(2, 559082264 / !scale_denominator!))))) exprs, way, way_area from (' + query + ') t)'
  }).filter(q => q)

  const selects = Object.entries(fields).map(([field, values]) => {
    if (values.length > 1 || values.includes(undefined)) {
      const escField = field.replace('-', '_')
      return `exprs->>'${field}' "${escField}"`
    }

    return null
  }).filter(v => v).join(', ')

  let result = 'select ' + selects + (selects !== '' ? ', ' : '') + 'way, way_area from (' + layerQs.join(' union all ') + ') t order by cast(exprs->>\'zIndex\' as float), way_area desc'
  result = result.replace(/</g, '&lt;')
  result = result.replace(/>/g, '&gt;')
  return result
}

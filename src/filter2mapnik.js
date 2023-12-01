const dbColumns = ['amenity', 'shop', 'highway']

function filter2mapnik (query, result = null) {
  let op
  let where = []

  if (query.constructor.name === 'FilterOr') {
    return 'select * from (' + query.parts.map(f => filter2mapnik(f)).join('\nUNION\n') + ') t'
  }
  else if (query.constructor.name === 'FilterAnd') {
    return console.log('not supported: FilterAnd')
  }
  else if (query.constructor.name === 'FilterQuery') {
    query.filters.map(filter => {
      switch (filter.op) {
        case 'has_key':
          where.push(dbColumns.includes(filter.key) ? colEsc(filter.key) + ' is not null' : 'tags ? ' + strEsc(filter.key))
          break
        case 'has_key':
          where.push(dbColumns.includes(filter.key) ? colEsc(filter.key) + ' is not null' : 'tags ? ' + strEsc(filter.key))
          break
        case 'not_exists':
          where.push(dbColumns.includes(filter.key) ? colEsc(filter.key) + ' is null' : ('tags->' + strEsc(filter.key) + ' is null'))
          break
        case '=':
        case '!=':
        case '~':
        case '!~':
        case '~i':
        case '!~i':
          op = filter.op.replace(/i$/, '*')
          where.push((dbColumns.includes(filter.key) ? colEsc(filter.key) : 'tags->' + strEsc(filter.key)) + ' ' + op + ' ' + strEsc(filter.value))
          break
        default:
          console.log('not supported:', filter)
      }
    })

    where = where.length ? where.join(' AND ') : 'true'

    switch (query.type) {
      case 'node':
        return "select 'node' as type, osm_id, hstore(ARRAY[" + dbColumns.map(k => strEsc(k) + ',' + colEsc(k)).join(',') + "]) || tags as tags from planet_osm_point where " + where
        break
      case 'way':
        return "(" +
          "select 'way' as type, osm_id, hstore(ARRAY[" + dbColumns.map(k => strEsc(k) + ',' + colEsc(k)).join(',') + "]) || tags as tags, way, 0 as way_area from planet_osm_polygon where osm_id > 0 and " + where +
          ") union (" +
          "select 'way' as type, osm_id, hstore(ARRAY[" + dbColumns.map(k => strEsc(k) + ',' + colEsc(k)).join(',') + "]) || tags as tags, way, 0 as way_area from planet_osm_line where osm_id > 0 and " + where +
          ")"
        break
      case 'relation':
        return "(" +
          "select 'relation' as type, -osm_id as osm_id, hstore(ARRAY[" + dbColumns.map(k => strEsc(k) + ',' + colEsc(k)).join(',') + "]) || tags as tags, way, 0 as way_area from planet_osm_polygon where osm_id < 0 and " + where +
          ") union (" +
          "select 'relation' as type, -osm_id as osm_id, hstore(ARRAY[" + dbColumns.map(k => strEsc(k) + ',' + colEsc(k)).join(',') + "]) || tags as tags, way, 0 as way_area from planet_osm_line where osm_id < 0 and " + where +
          ")"
        break
        break
      case 'nwr':
        return "(" +
          "select 'node' as type, osm_id, hstore(ARRAY[" + dbColumns.map(k => strEsc(k) + ',' + colEsc(k)).join(',') + "]) || tags as tags, way, 0 as way_area from planet_osm_point where " + where +
          ") union (" +
          "select case when osm_id < 0 then 'relation' else 'way' end as type, abs(osm_id) as osm_id, hstore(ARRAY[" + dbColumns.map(k => strEsc(k) + ',' + colEsc(k)).join(',') + "]) || tags as tags, way, 0 as way_area from planet_osm_polygon where " + where +
          ") union (" +
          "select case when osm_id < 0 then 'relation' else 'way' end as type, abs(osm_id) as osm_id, hstore(ARRAY[" + dbColumns.map(k => strEsc(k) + ',' + colEsc(k)).join(',') + "]) || tags as tags, way, 0 as way_area from planet_osm_line where " + where +
          ")"
    }
  }

  return ''
}

module.exports = filter2mapnik

function colEsc (k) {
  return `"${k}"`
}

function strEsc (k) {
  return `'${k}'`
}

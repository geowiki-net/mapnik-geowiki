const dbLayout = require('./dbLayout.json')

function filter2mapnik (query) {
  if (query.constructor.name === 'FilterOr') {
    return 'select * from (' + query.parts.map(f => filter2mapnik(f)).join('\nUNION\n') + ') t'
  } else if (query.constructor.name === 'FilterAnd') {
    return console.log('not supported: FilterAnd')
  }

  return Object.entries(dbLayout)
    .map(([ table, layout ]) => filter2mapnik_table(table, layout, query))
    .filter(v => v)
    .join(' union ')
}

function filter2mapnik_table(table, layout, query) {
  let op
  let where = []

  const dbColumns = layout.textColumns.concat(layout.intColumns)

  if (!query.type in layout.types && query.type !== 'nwr') {
    return null
  }

  let idSelect = "osm_id"
  let typeSelect = null
  let typeWhere = ''
  let negId = false, posId = false
  Object.entries(layout.types).forEach(([type, idMod]) => {
    if (query.type !== type && query.type !== 'nwr') {
      return
    }

    typeSelect = `'${type}'`
    if (idMod === '>0') {
      posId = type
    }
    if (idMod === '<0') {
      negId = type
    }
  })

  if (!typeSelect) {
    return null
  }

  if (posId && negId) {
    typeSelect = `case when osm_id < 0 then '${negId}' else '${posId}' end`
    idSelect = 'abs(osm_id) as osm_id'
  } else if (posId) {
    typeSelect = `'${posId}'`
    typeWhere = 'osm_id > 0 and '
  } else if (negId) {
    idSelect = '-osm_id as osm_id'
    typeSelect = `'${negId}'`
    typeWhere = 'osm_id < 0 and '
  }

  const wayAreaSelect = layout.has_way_area ? 'way_area' : '0 as way_area'

  if (query.constructor.name === 'FilterQuery') {
    query.filters.forEach(filter => {
      switch (filter.op) {
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

    return `select ${typeSelect} as type, ${idSelect}, hstore(ARRAY[` + compileColumns(layout) + `]) || tags as tags, way, ${wayAreaSelect} from ${table} where ${typeWhere} ` + where
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

function compileColumns (layout) {
  let result = layout.textColumns.map(k => strEsc(k) + ',' + colEsc(k)).join(',')
  result += (result.length ? ',' : '') + layout.intColumns.map(k => strEsc(k) + ',cast(' + colEsc(k) + ' as text)').join(',')

  return result
}

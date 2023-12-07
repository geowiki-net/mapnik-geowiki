const twigCompile = require('./twigCompile')
const compileQuery = require('./compileQuery')

const defaultStyle = require('./defaultStyle.json')
const fieldConfig = require('./fieldConfig.json')

module.exports = class Layer {
  constructor (id, layer, globalData, options) {
    this.id = id
    this.layer = layer
    this.globalData = globalData
    this.options = options
  }

  zoomLevelActive (zoom) {
    if (typeof this.layer.query === 'string') {
      return true
    }

    if (Object.keys(this.layer.query).filter(z => z <= zoom).length) {
      return true
    }
  }

  compileQueries () {
    if (typeof this.layer.query === 'string') {
      return {
        0: compileQuery(this.layer.query)
      }
    } else {
      return Object.fromEntries(
        Object.entries(this.layer.query)
          .map(([ z, query ]) => [ z, compileQuery(query) ])
      )
    }
  }

  compileLayerTable () {
    let funcname = this.options.id + '_layer_' + this.id
    if (this.options.schema) {
      funcname = this.options.schema + '.' + funcname
    }

    return 'select * from ' + funcname + '(!bbox!, jsonb_build_object(\'scale_denominator\', !scale_denominator!, \'zoom\', round(log(2, 559082264 / !scale_denominator!)))) exprs'
  }

  compileFunction (styleFieldValues) {
    let result = `
const twig = require('twig').twig
const isTrue = require('./src/isTrue')
const twigRender = require('./src/twigRender')
function valueMap(value, map) {
  return value in map ? map[value] : value
}
`

    result += 'module.exports = { layer' + this.id + ': (bbox, map) => {\n'
    result += 'const queries = Object.entries(' + JSON.stringify(this.compileQueries(), null, '  ') + ').filter(([ z, q ]) => z <= map.zoom).reverse()\n'
    result += 'if (!queries.length) { return }\n'
    result += 'const query = "select * from (" + queries[0][1] + ")t where way && \'" + bbox + "\'::geometry"\n'
    result += 'plv8.execute(query).forEach(d => assess(d.type, d.osm_id, d.tags, d.way, d.way_area, map))\n'
    result += '}}\n'

    result += 'function assess (type, osm_id, tags, way, way_area, map) {\n'
    result += 'const data = { id: type.substr(0, 1) + osm_id, osm_id, type, tags, map'
    if (this.globalData.const) {
      result += '\n,const: ' + JSON.stringify(this.globalData.const)
    }
    result += '}\n'

    if (this.layer.feature.pre) {
      result += 'twigRender(' + JSON.stringify(this.layer.feature.pre) + ', data)\n'
    }
    if (this.layer.feature.init) {
      result += 'twigRender(' + JSON.stringify(this.layer.feature.pre) + ', data)\n'
    }

    result += 'const result = {\n'

    const f = Object.entries(this.layer.feature).map(([k, featureStyle]) => {
      if (k !== 'style' && !k.match(/^style:/)) {
        return null
      }

      const styleId = k === 'style' ? 'default' : k.substr(6)

      const style = { ...defaultStyle, ...featureStyle }
      const str = Object.entries(style).map(([k, v]) => {
        if (styleFieldValues[k].length === 1 && !styleFieldValues[k].includes(undefined)) {
          return null
        }

        const value = twigCompile(v, fieldConfig[k] ?? {})

        if (value === null) {
          return null
        } else {
          return JSON.stringify(k) + ': ' + value
        }
      }).filter(s => s).join(',\n')

      return JSON.stringify(styleId) + ': {\n' + str + '\n}'
    }).filter(s => s)

    result += f.join(',\n') + '\n}\n'

    result += twigCompile(this.layer.feature.styles ?? 'default') +
      '.split(",").forEach(s => {\n' +
      'const r = result[s.trim()]\n' +
      'r.way = way\n' +
      'r.way_area = way_area\n' +
      'plv8.return_next(r)\n' +
      '})'
    result += '}'

    return result
  }
}

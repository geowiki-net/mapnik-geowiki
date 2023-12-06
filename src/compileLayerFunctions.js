const defaultStyle = require('./defaultStyle.json')
const twigCompile = require('./twigCompile')
const fieldConfig = require('./fieldConfig.json')

module.exports = function compileLayerFunctions (layers, styleFieldValues, globalData, options) {
  return layers.map((layer, i) => {
    let result = `
const twig = require('twig').twig
const isTrue = require('./src/isTrue')
const twigRender = require('./src/twigRender')
function valueMap(value, map) {
  return value in map ? map[value] : value
}
`

    result += 'module.exports = { layer' + i + ': (type, osm_id, tags, map) => {\n'
    result += 'const data = { id: type.substr(0, 1) + osm_id, osm_id, type, tags, map'
    if (globalData.const) {
      result += '\n,const: ' + JSON.stringify(globalData.const)
    }
    result += '}\n'

    if (layer.feature.pre) {
      result += 'twigRender(' + JSON.stringify(layer.feature.pre) + ', data)\n'
    }
    if (layer.feature.init) {
      result += 'twigRender(' + JSON.stringify(layer.feature.pre) + ', data)\n'
    }

    result += 'const result = {\n'

    const f = Object.entries(layer.feature).map(([k, featureStyle]) => {
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

    result += 'return ' + twigCompile(layer.feature.styles ?? 'default') +
      '.split(",").map(s => result[s.trim()])'

    result += '\n}\n}'

    return result
  })
}

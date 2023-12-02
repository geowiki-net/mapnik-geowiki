const defaultStyle = require('./defaultStyle.json')
const twigCompile = require('./twigCompile')

const types = {
  fill: 'boolean',
  stroke: 'boolean'
}

module.exports = function compileLayerFunctions (layers, styleFieldValues) {
  return layers.map((layer, i) => {
    let result = `
const twig = require('twig').twig
const isTrue = require('./src/isTrue')
function twigRender(data, values) {
  return twig({data}).render(values)
}
`

    result += 'module.exports = { layer' + i + ': (type, osm_id, tags) => {\n'
    result += 'const data = { id: type.substr(0, 1) + osm_id, osm_id, type, tags }\n'
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

        const value = twigCompile(v, types[k])

        if (value !== null) {
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

const defaultStyle = require('./defaultStyle.json')

module.exports = function compileLayerFunctions (layers, styleFieldValues) {
  return layers.map((layer, i) => {
    let result = `
const twig = require('twig').twig
function twigRender(data, values) {
  return twig({data}).render(values)
}
`

    result += 'module.exports = { layer' + i + ': (type, osm_id, tags) => {\n'
    result += 'const data = { id: type.substr(0, 1) + osm_id, osm_id, type, tags }\n'
    result += 'return {\n'

    const style = { ...defaultStyle, ...layer.feature.style }
    const f = Object.entries(style).map(([k, v]) => {
      if (typeof v === 'string' && v.includes('{')) {
        return JSON.stringify(k) + ': twigRender(' + JSON.stringify(v) + ', data)'
      }
      else if (styleFieldValues[k].length > 1 || styleFieldValues[k].includes(undefined)) {
        return JSON.stringify(k) + ': ' + JSON.stringify(v)
      }
    }).filter(s => s)

    result += f.join(',\n') + '\n}\n}\n}'

    return result
  })
}

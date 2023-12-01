module.exports = function compileLayerFunctions (layers, styleFieldValues) {
  let result = `
const twig = require('twig').twig
function twigRender(data, values) {
  return twig({data}).render(values)
}
module.exports = {
`

  result += layers.map((layer, i) => {
    let result = 'layer' + i + ': (type, osm_id, tags) => {\n'
    result += 'const data = { id: type.substr(0, 1) + osm_id, osm_id, type, tags }\n'
    result += 'return {\n'

    const f = Object.entries(layer.feature.style).map(([k, v]) => {
      if (typeof v === 'string' && v.includes('{')) {
        return JSON.stringify(k) + ': twigRender(' + JSON.stringify(v) + ', data)'
      }
    }).filter(s => s)

    result += f.join(',\n') + '\n}\n}'

    return result
  }).join(',\n')

  result += '}'

  return result
}

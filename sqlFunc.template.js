const twig = require('twig').twig
function twigRender(data, values) {
  return twig({data}).render(values)
}
module.exports = { _tmp: (type, osm_id, tags) => {
  const data = { id: type.substr(0, 1) + osm_id, osm_id, type, tags }
  return [
    %templates%
  ]
}}

const twig = require('twig').twig
const templates = {}

module.exports = function twigRender (data, values) {
  if (!(data in templates)) {
    templates[data] = twig({ data })
  }

  return templates[data].render(values)
}

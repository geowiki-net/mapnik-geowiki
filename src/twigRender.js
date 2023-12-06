const twig = require('twig').twig

module.exports = function twigRender(data, values) {
  return twig({data}).render(values)
}

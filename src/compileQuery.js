const GeowikiAPI = require('@geowiki-net/geowiki-api')
const filter2mapnik = require('./filter2mapnik')
const compileTemplate = require('@geowiki-net/geowiki-layer/src/compileTemplate.js')
const twig = require('twig')

module.exports = function (query, options) {
  const twigData = {
    parameters: options.parameters
  }

  const template = compileTemplate(query, twig)
  if (typeof template === 'function') {
    query = template(twigData)
  }

  const filter = new GeowikiAPI.Filter(query)
  return filter2mapnik(filter.sets._)
}

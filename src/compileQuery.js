const OverpassFrontend = require('overpass-frontend')
const filter2mapnik = require('./filter2mapnik')

module.exports = function (query, options) {
  const filter = new OverpassFrontend.Filter(query)
  return filter2mapnik(filter.sets._)
}

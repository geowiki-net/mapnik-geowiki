const OverpassFrontend = require('overpass-frontend')
const filter2mapnik = require('./filter2mapnik')

module.exports = function compile (data) {
  const filter = new OverpassFrontend.Filter(data.query)
  console.log(JSON.stringify(filter.def, null, '  '))
  console.log(filter2mapnik(filter.def))
}

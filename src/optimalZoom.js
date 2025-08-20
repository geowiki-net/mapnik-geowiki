const { SphericalMercator } = require('@mapbox/sphericalmercator')
const merc = new SphericalMercator()

module.exports = function optimalZoom (options) {
  let scale = 1
  let zoom = 1
  const precision = 0.1

  while (true) {
    const bottomLeft = merc.px([ options.bbox.minlon, options.bbox.minlat ], zoom)
    const upperRight = merc.px([ options.bbox.maxlon, options.bbox.maxlat ], zoom)
    const size = [ upperRight[0] - bottomLeft[0], bottomLeft[1] - upperRight[1] ]

    if (size[0] < options.size[0] - precision && size[1] < options.size[1] - precision) {
      zoom += scale
    }
    else if (size[0] > options.size[0] || size[1] > options.size[1]) {
      zoom -= scale
      scale /= 2
    }
    else {
      return zoom
    }
  }
}

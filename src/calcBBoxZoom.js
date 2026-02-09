const { SphericalMercator } = require('@mapbox/sphericalmercator')
const merc = new SphericalMercator()
const optimalZoom = require('./optimalZoom')

module.exports = function calcBBoxZoom (options) {
  if (options.center && options.bbox) {
    throw new Error('Specify either center or bounding box.')
  } else if (options.center) {
    const b = options.center.split(',')
    options.bbox = {
      minlat: parseFloat(b[0]),
      minlon: parseFloat(b[1]),
      maxlat: parseFloat(b[0]),
      maxlon: parseFloat(b[1])
    }

    if (!options.zoom) {
      throw new Error('Parameter --center requires zoom level')
    }
  } else if (options.bbox) {
    const b = options.bbox.split(',')
    options.bbox = {
      minlat: parseFloat(b[0]),
      minlon: parseFloat(b[1]),
      maxlat: parseFloat(b[2]),
      maxlon: parseFloat(b[3])
    }
  } else {
    throw new Error('Specify either center or bounding box.')
  }

  if (options.size) {
    options.size = options.size.split('x').map(v => parseInt(v))
  }

  if (options.margin) {
    options.margin = options.margin.split('x').map(v => parseInt(v))
    if (options.margin.length === 1) {
      options.margin = [options.margin[0], options.margin[0]]
    }
  } else {
    options.margin = [0, 0]
  }

  if (options.zoom) {
    options.zoom = parseFloat(options.zoom)

    if (options.center && !options.size) {
      throw new Error('Specify image size.')
    }
  } else {
    if (!options.size) {
      throw new Error('Specify either output size or zoom level.')
    }
  }

  if (!options.zoom) {
    options.zoom = optimalZoom(options)
    console.log('optimal zoom', options.zoom)
  }

  const bottomLeft = merc.px([options.bbox.minlon, options.bbox.minlat], options.zoom)
  const upperRight = merc.px([options.bbox.maxlon, options.bbox.maxlat], options.zoom)
  const size = [upperRight[0] - bottomLeft[0], bottomLeft[1] - upperRight[1]]
  console.log('Size of bounding box at zoom', size)

  if (!options.size) {
    options.size = size
  }
  options.size = [options.size[0] + options.margin[0] * 2, options.size[1] + options.margin[1] * 2]

  const newBL = merc.ll([bottomLeft[0] - (options.size[0] - size[0]) / 2, bottomLeft[1] + (options.size[1] - size[1]) / 2], options.zoom)
  const newUR = merc.ll([upperRight[0] + (options.size[0] - size[0]) / 2, upperRight[1] - (options.size[1] - size[1]) / 2], options.zoom)

  options.bbox = {
    minlon: newBL[0],
    minlat: newBL[1],
    maxlon: newUR[0],
    maxlat: newUR[1]
  }

  console.log('Using bbox (including margin):', options.bbox)

  return options
}

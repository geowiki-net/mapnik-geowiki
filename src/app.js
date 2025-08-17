const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const async = require('async')
const child_process = require('child_process')

const { SphericalMercator } = require('@mapbox/sphericalmercator')
const merc = new SphericalMercator()
const turf = {
  buffer: require('@turf/buffer').default
}

const OverpassFrontend = require('overpass-frontend')
const GeowikiLayer = require('geowiki-layer')
const BoundingBox = require('boundingbox')

const loadStyleFile = require('./loadStyleFile')
const compile = require('./compile')
const Layer = require('./Layer')
require('./debug')

require('../modules.js')

function mapnikGeowiki (options, callback) {
  const overpassFrontend = new OverpassFrontend(options.source)

  let cacheEnabled = options.cache_file !== ''
  if (!options.source.match(/^(https?:)?\/\//)) {
    cacheEnabled = false
  }
  if (!overpassFrontend.cacheDump) {
    cacheEnabled = false
  }
  console.log('cache enabled', cacheEnabled)

  if (cacheEnabled) {
    if (fs.existsSync(options.cache_file)) {
      overpassFrontend.cacheRestore(JSON.parse(fs.readFileSync(options.cache_file)))
    }
  }

  if (!options.id) {
    const fileinfo = path.parse(options.style)
    options.id = fileinfo.name
  }

if (options.center && options.bbox) {
  console.log("Specify either center or bounding box.")
  process.exit(1)
} else if (options.center) {
    const b = options.center.split(',')
    options.bbox = {
      minlat: parseFloat(b[0]),
      minlon: parseFloat(b[1]),
      maxlat: parseFloat(b[0]),
      maxlon: parseFloat(b[1])
    }

    if (!options.zoom) {
      return callback(new Error('Parameter --center requires zoom level'))
    }
  }
  else if (options.bbox) {
    const b = options.bbox.split(',')
    options.bbox = {
      minlat: parseFloat(b[0]),
      minlon: parseFloat(b[1]),
      maxlat: parseFloat(b[2]),
      maxlon: parseFloat(b[3])
    }
  }

  if (options.size) {
    options.size = options.size.split('x').map(v => parseInt(v))
  }

  if (options.margin) {
    options.margin = options.margin.split('x').map(v => parseInt(v))
    if (options.margin.length === 1) {
      options.margin = [ options.margin[0], options.margin[0] ]
    }
  } else {
    options.margin = [ 0, 0 ]
  }

  if (!options.bbox && !options.center) {
    console.log("Specify either bounding box or center.")
    process.exit(1)
  }

  if (options.zoom) {
    options.zoom = parseFloat(options.zoom)

    if (options.center && !options.size) {
      console.log("Specify image size.")
      process.exit(1)
    }
  } else {
    if (!options.size) {
      console.log("Specify either output size or zoom level.")
      process.exit(1)
    }
  }

  if (!options.zoom) {
    options.zoom = optimalZoom(options.bbox, options.size)
    console.log('optimal zoom', options.zoom)
  }

  function optimalZoom (bbox, sizePixels) {
    let scale = 1
    let zoom = 1
    const precision = 0.1

    while (true) {
      const bottomLeft = merc.px([ options.bbox.minlon, options.bbox.minlat ], zoom)
      const upperRight = merc.px([ options.bbox.maxlon, options.bbox.maxlat ], zoom)
      const size = [ upperRight[0] - bottomLeft[0], bottomLeft[1] - upperRight[1] ]

      if (size[0] < sizePixels[0] - precision && size[1] < sizePixels[1] - precision) {
        zoom += scale
      }
      else if (size[0] > sizePixels[0] || size[1] > sizePixels[1]) {
        zoom -= scale
        scale /= 2
      }
      else {
        return zoom
      }
    }
  }

  const bottomLeft = merc.px([ options.bbox.minlon, options.bbox.minlat ], options.zoom)
  const upperRight = merc.px([ options.bbox.maxlon, options.bbox.maxlat ], options.zoom)
  const size = [ upperRight[0] - bottomLeft[0], bottomLeft[1] - upperRight[1] ]
  console.log('Size of bounding box at zoom', size)

  if (!options.size) {
    options.size = size
  }
  options.size = [ options.size[0] + options.margin[0] * 2, options.size[1] + options.margin[1] * 2 ]

  const newBL = merc.ll([bottomLeft[0] - (options.size[0] - size[0]) / 2, bottomLeft[1] + (options.size[1] - size[1]) / 2], options.zoom)
  const newUR = merc.ll([upperRight[0] + (options.size[0] - size[0]) / 2, upperRight[1] - (options.size[1] - size[1]) / 2], options.zoom)

  options.bbox = {
    minlon: newBL[0],
    minlat: newBL[1],
    maxlon: newUR[0],
    maxlat: newUR[1]
  }

  const metersPerPixel = 40075016.686 * Math.abs(Math.cos(new BoundingBox(options.bbox).getCenter().lat / 180 * Math.PI)) / Math.pow(2, options.zoom + 8)

  loadStyleFile(options, (err, data) => {
    if (err) {
      return console.error(err)
    }

    const stylesheet = compile(data, options)

    const filename = options.id + '.xml'
    console.log('create ' + filename)
    fs.writeFileSync(filename, stylesheet)

    async.mapValues(data.layers, (layerOptions, i, done) => {
      const _layer = new Layer(i, layerOptions)
      _layer.layer.overpassFrontend = overpassFrontend
      const layer = new GeowikiLayer(_layer.layer)

      layer.on('twigData', (ob, feature, twigData) => {
        twigData.parameters = options.parameters
      })

      layer.moveTo({
        bounds: options.bbox,
        zoom: options.zoom
      }, (err) => {
        done(null, layer.features())
        console.log('loaded')
      })
    }, (err, result) => {
      const features = []

      Object.values(result)
        .flat()
        .forEach(item => {
          const geojson = item.object.GeoJSON()

          item.data.styles.forEach(style => {
            let properties = style === 'default' ? item.data.style : item.data['style:' + style]
            let geometry = geojson.geometry

            if (properties.geometry) {
              try {
                geometry = JSON.parse(properties.geometry)
              }
              catch (e) {
                console.error("Can't parse geometry: \"" + properties.geometry + "\"")
                return
              }
            }

            if (!properties || !geometry) {
              return
            }

            if (geometry.type === 'Point') {
              let radius = parseFloat(properties.radius ?? 10)
              switch (properties.nodeFeature ?? 'CircleMarker') {
                case 'CircleMarker':
                  radius = radius * metersPerPixel / 1000
                  /* fallthrough */
                case 'Circle':
                  geometry = turf.buffer(geometry, radius, {unit: 'meters'}).geometry
              }
            }

            features.push({
              type: 'Feature',
              geometry,
              properties
            })
          })
        })

      features
        .sort((a, b) => {
          return (a.properties.zIndex ?? 0) - (b.properties.zIndex ?? 0)
        })

      fs.writeFileSync('data.geojson', JSON.stringify({
        type: 'FeatureCollection',
        features
      }))

      if (cacheEnabled) {
        fs.writeFileSync(options.cache_file, JSON.stringify(overpassFrontend.cacheDump()))
      }

      render()
    })
  })

  function render () {
    let param = []

    if ('bbox' in options) {
      const bounds = new BoundingBox(options.bbox)
      param = param.concat(['-b', bounds.minlon, bounds.minlat, bounds.maxlon, bounds.maxlat])
    }

    if ('zoom' in options) {
      param.push('-z')
      param.push(options.zoom)
    }

    param.push(options.id + '.xml')
    param.push(options.output)

    const p = child_process.spawn('nik4', param)

    p.stdout.on('data', data => console.log(data.toString()))
    p.stderr.on('data', data => console.error(data.toString()))
    p.on('close', code => {
      console.log('closed with code ' + code)
      callback(code)
    })
  }
}

module.exports = mapnikGeowiki

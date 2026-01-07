const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const async = require('async')

const OverpassFrontend = require('overpass-frontend')
const GeowikiLayer = require('geowiki-layer')

const loadStyleFile = require('./loadStyleFile')
const compile = require('./compile')
const Layer = require('./Layer')
const calcBBoxZoom = require('./calcBBoxZoom')
const render2GeoJSON = require('./render2GeoJSON')
const renderMapnik = require('./renderMapnik')
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

  try {
    options = calcBBoxZoom(options)
  }
  catch (e) {
    return callback(e)
  }

  loadStyleFile(options, (err, data) => {
    if (err) {
      return console.error(err)
    }

    const stylesheet = compile(data, options)

    const filename = options.id + '.xml'
    console.log('create ' + filename)
    fs.writeFileSync(filename, stylesheet)

    async.mapValues(data.layers, (layerOptions, i, done) => {
      console.log('start ' + i)
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
        const features = layer.features()
        console.log('loaded ' + i, features.length)

        done(null, features)
      })
    }, (err, result) => {
      console.log('final')
      render2GeoJSON(result, options)

      if (cacheEnabled) {
        fs.writeFileSync(options.cache_file, JSON.stringify(overpassFrontend.cacheDump()))
      }

      renderMapnik(options, callback)
    })
  })
}

module.exports = mapnikGeowiki

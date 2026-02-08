const fs = require('fs')
const path = require('path')
const async = require('async')
const Events = require('events')

const OverpassFrontend = require('@geowiki-net/geowiki-api')
const GeowikiLayer = require('@geowiki-net/geowiki-layer')
const initModules = require('geowiki-lib-modules').default

const loadStyleFile = require('./loadStyleFile')
const compile = require('./compile')
const Layer = require('./Layer')
const calcBBoxZoom = require('./calcBBoxZoom')
const render2GeoJSON = require('./render2GeoJSON')
const renderMapnik = require('./renderMapnik')

class App extends Events {
  constructor (options) {
    super()

    // this.state = state
    this.config = options
    this.config.path = path.resolve(__dirname, '../')
  }

  initModules (callback) {
    initModules(this, 'appInit', App.modules, (err) => {
      if (err) {
        console.error(err.message)
        process.exit(1)
      }

      callback()
    })
  }
}

App.modules = [...require('../modules.js')]

function mapnikGeowiki (options, callback) {
  const app = new App(options)

  app.config.lang = options.language

  app.initModules(() => _mapnikGeowiki(options, callback))
}

function _mapnikGeowiki (options, callback) {
  const overpassFrontend = new OverpassFrontend(options.source)

  if (!options.id) {
    const fileinfo = path.parse(options.style)
    options.id = fileinfo.name
  }

  try {
    options = calcBBoxZoom(options)
  } catch (e) {
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
        if (err) { return callback(err) }

        const features = layer.features()
        console.log('loaded ' + i, features.length)

        done(null, features)
      })
    }, (err, result) => {
      console.log('final')
      if (err) { return callback(err) }

      render2GeoJSON(result, options)

      renderMapnik(options, callback)
    })
  })
}

module.exports = mapnikGeowiki

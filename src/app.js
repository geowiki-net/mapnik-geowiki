const fs = require('fs')
const path = require('path')
const async = require('async')
const Events = require('events')

const GeowikiAPI = require('@geowiki-net/geowiki-api')
const GeowikiLayer = require('@geowiki-net/geowiki-layer')
const { initModules, logMessage } = require('@geowiki-net/geowiki-lib-modules')

const loadStyle = require('./loadStyle')
const compile = require('./compile')
const Layer = require('./Layer')
const calcBBoxZoom = require('./calcBBoxZoom')
const render2GeoJSON = require('./render2GeoJSON')
const renderMapnik = require('./renderMapnik')

const baseModules = [
  require('./config.js'),
  require('./tmpDir'),
  require('./loadStyleCurrentPath.js'),
  require('@geowiki-net/geowiki-style-registry').default,
]

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

App.modules = [ ...baseModules, ...require('../modules.js')]
let app

function mapnikGeowiki (options, callback) {
  if (options.verbose) {
    logMessage.setVerbosity(1)
  }

  app = new App(options)

  app.config.lang = options.language

  app.initModules(() => _mapnikGeowiki(options, callback))
}

function _mapnikGeowiki (options, callback) {
  const geowikiAPI = options.source instanceof GeowikiAPI ? options.source : new GeowikiAPI(options.source)

  if (!options.id) {
    const fileinfo = path.parse(options.style)
    options.id = fileinfo.name
  }

  try {
    options = calcBBoxZoom(options)
  } catch (e) {
    return callback(e)
  }

  loadStyle(app, options, (err, data) => {
    if (err) {
      return console.error(err)
    }

    const stylesheet = compile(data, options)

    const filename = options.id + '.xml'
    logMessage('create ' + filename)
    fs.writeFileSync(options.tmpDir + '/' + filename, stylesheet)

    async.mapValues(data.layers, (layerOptions, i, done) => {
      logMessage('start ' + i)
      const _layer = new Layer(i, layerOptions)
      _layer.layer.overpassFrontend = geowikiAPI
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
        logMessage('loaded ' + i + ' (' + features.length + ' items)')

        done(null, features)
      })
    }, (err, result) => {
      logMessage('final')
      if (err) { return callback(err) }

      render2GeoJSON(result, options)

      renderMapnik(options, callback)
    })
  })
}

module.exports = mapnikGeowiki

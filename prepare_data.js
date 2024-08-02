#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const async = require('async')
const ArgumentParser = require('argparse').ArgumentParser
const OverpassFrontend = require('overpass-frontend')
const loadStyleFile = require('./src/loadStyleFile')
const GeowikiLayer = require('geowiki-layer')
const BoundingBox = require('boundingbox')
const child_process = require('child_process')

const parser = new ArgumentParser({
  add_help: true,
  description: 'Convert a geowiki stylesheet into a Mapnik stylesheet'
})

parser.add_argument('filename', {
  help: 'The geowiki stylesheet to compile, e.g. "file.yaml"'
})

parser.add_argument('--id', '-i', {
  help: 'The ID to use. By default, the filename without extension will be used.',
  default: null
})

parser.add_argument('--source', '-s', {
  help: 'OpenStreetMap source, may be an Overpass API or a .osm file',
  default: '//overpass-api.de/api/interpreter'
})

parser.add_argument('--bbox', '-b', {
  help: 'Render map in this bounding box (lat,lon,lat,lon)'
})

parser.add_argument('--zoom', '-z', {
  help: 'Render map for this zoom level'
})

parser.add_argument('--output', '-o', {
  help: 'Output image file (default: image.svg)',
  default: 'image.svg'
})

const options = parser.parse_args()

const overpassFrontend = new OverpassFrontend(options.source)

if (!options.id) {
  const fileinfo = path.parse(options.filename)
  options.id = fileinfo.name
}

if (options.bbox) {
  const b = options.bbox.split(',')
  options.bbox = {
    minlat: parseFloat(b[0]),
    minlon: parseFloat(b[1]),
    maxlat: parseFloat(b[2]),
    maxlon: parseFloat(b[3])
  }
}

if ('zoom' in options) {
  options.zoom = parseFloat(options.zoom)
}

loadStyleFile(options, (err, data) => {
  if (err) {
    return console.error(err)
  }

  async.map(data.layers, (layerOptions, done) => {
    layerOptions.overpassFrontend = overpassFrontend
    const layer = new GeowikiLayer(layerOptions)
    layer.moveTo({
      bounds: options.bbox,
      zoom: options.zoom
    }, (err) => {
      done(null, layer.features())
      console.log('loaded')
    })
  }, (err, result) => {
    const features = []

    result
      .flat()
      .forEach(item => {
        const geojson = item.object.GeoJSON()

        item.data.styles.forEach(style => {
          features.push({
            type: 'Feature',
            geometry: geojson.geometry,
            properties: style === 'default' ? item.data.style : item.data['style:' + style]
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

    render()
  })
})

function render () {
  const bounds = new BoundingBox(options.bbox)

  const param = ['-b', bounds.minlon, bounds.minlat, bounds.maxlon, bounds.maxlat]

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
  })
}
